//go:build linux

package files

import (
	"encoding/json"
	"errors"
	"golang.org/x/sys/unix"
	"log/slog"
	"mime"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func jsonResponse(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func failure(w http.ResponseWriter, err error) {
	status, code, message := 500, "STORAGE_UNAVAILABLE", "Storage operation failed"
	switch {
	case errors.Is(err, unix.E2BIG):
		status, code, message = 422, "UNSUPPORTED_OPERATION", "This directory exceeds the 50,000-entry safety limit"
	case errors.Is(err, ErrPath):
		status, code, message = 400, "INVALID_PATH", "Use a valid relative storage path"
	case errors.Is(err, unix.EXDEV), errors.Is(err, unix.ELOOP):
		status, code, message = 403, "OUTSIDE_ROOT", "Links and filesystem boundaries cannot be followed"
	case errors.Is(err, os.ErrNotExist):
		status, code, message = 404, "NOT_FOUND", "Entry not found"
	case errors.Is(err, os.ErrExist):
		status, code, message = 409, "ALREADY_EXISTS", "An entry with this name already exists"
	case errors.Is(err, os.ErrPermission), errors.Is(err, unix.EROFS):
		status, code, message = 403, "PERMISSION_DENIED", "Storage is read-only or access is denied"
	case errors.Is(err, unix.ENOTEMPTY):
		status, code, message = 409, "NOT_EMPTY", "Directory is not empty; confirm recursive deletion"
	case errors.Is(err, unix.EFBIG):
		status, code, message = 413, "TOO_LARGE", "Upload exceeds the configured size limit"
	case errors.Is(err, unix.ENOSPC):
		status, code, message = 507, "STORAGE_FULL", "Storage has no free space"
	case errors.Is(err, unix.EBUSY):
		status, code, message = 429, "UPLOAD_BUSY", "Another upload is in progress; try again later"
	case errors.Is(err, unix.EINVAL):
		status, code, message = 400, "UNSUPPORTED_OPERATION", "This operation is not supported for this entry"
	}
	if status >= 500 {
		slog.Error("storage operation failed", "code", code, "error", err)
	}
	jsonResponse(w, status, map[string]any{"error": map[string]string{"code": code, "message": message}})
}
func (s *Service) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) { jsonResponse(w, 200, map[string]string{"status": "ok"}) })
	mux.HandleFunc("GET /root", func(w http.ResponseWriter, r *http.Request) {
		var stat unix.Statfs_t
		if err := unix.Fstatfs(int(s.root.Fd()), &stat); err != nil {
			failure(w, err)
			return
		}
		jsonResponse(w, 200, map[string]any{"name": "Shared storage", "writable": s.Writable && stat.Flags&unix.ST_RDONLY == 0, "availableBytes": stat.Bavail * uint64(stat.Bsize), "totalBytes": stat.Blocks * uint64(stat.Bsize), "maxUploadBytes": s.MaxUpload})
	})
	mux.HandleFunc("GET /entries", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		offset, _ := strconv.Atoi(q.Get("offset"))
		limit, _ := strconv.Atoi(q.Get("limit"))
		if offset < 0 || offset > 1000000 || limit < 0 {
			failure(w, ErrPath)
			return
		}
		if limit == 0 || limit > 500 {
			limit = 100
		}
		entries, total, err := s.List(q.Get("path"), q.Get("sort"), q.Get("hidden") == "1", offset, limit)
		if err != nil {
			failure(w, err)
			return
		}
		jsonResponse(w, 200, map[string]any{"entries": entries, "total": total, "offset": offset, "limit": limit})
	})
	mux.HandleFunc("POST /directories", func(w http.ResponseWriter, r *http.Request) {
		var input struct {
			Path string `json:"path"`
		}
		r.Body = http.MaxBytesReader(w, r.Body, 8192)
		if json.NewDecoder(r.Body).Decode(&input) != nil {
			failure(w, ErrPath)
			return
		}
		if err := s.Mkdir(input.Path); err != nil {
			failure(w, err)
			return
		}
		jsonResponse(w, 201, map[string]string{"path": input.Path})
	})
	mux.HandleFunc("POST /move", func(w http.ResponseWriter, r *http.Request) {
		var input struct {
			Source string `json:"source"`
			Target string `json:"target"`
		}
		r.Body = http.MaxBytesReader(w, r.Body, 16384)
		if json.NewDecoder(r.Body).Decode(&input) != nil {
			failure(w, ErrPath)
			return
		}
		if err := s.Move(input.Source, input.Target); err != nil {
			failure(w, err)
			return
		}
		w.WriteHeader(204)
	})
	mux.HandleFunc("DELETE /entries", func(w http.ResponseWriter, r *http.Request) {
		if err := s.Delete(r.URL.Query().Get("path"), r.URL.Query().Get("recursive") == "1"); err != nil {
			failure(w, err)
			return
		}
		w.WriteHeader(204)
	})
	mux.HandleFunc("PUT /content", func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, s.MaxUpload+1)
		if err := s.Upload(r.URL.Query().Get("path"), r.Body); err != nil {
			failure(w, err)
			return
		}
		w.WriteHeader(204)
	})
	mux.HandleFunc("GET /content", func(w http.ResponseWriter, r *http.Request) {
		f, err := s.Download(r.URL.Query().Get("path"))
		if err != nil {
			failure(w, err)
			return
		}
		defer f.Close()
		info, err := f.Stat()
		if err != nil {
			failure(w, err)
			return
		}
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": info.Name()}))
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Content-Security-Policy", "sandbox; default-src 'none'")
		http.ServeContent(w, r, info.Name(), info.ModTime(), f)
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		if r.URL.Path != "/health" {
			if r.Header.Get("X-Usecloud-User") == "" {
				jsonResponse(w, 401, map[string]any{"error": map[string]string{"code": "AUTH_REQUIRED", "message": "Core identity required"}})
				return
			}
			permission := "storage.shared.read"
			if r.Method != "GET" {
				permission = "storage.shared.write"
			}
			granted := false
			for _, p := range strings.Split(r.Header.Get("X-Usecloud-Permissions"), ",") {
				if p == permission {
					granted = true
				}
			}
			if !granted {
				failure(w, os.ErrPermission)
				return
			}
		}
		mux.ServeHTTP(w, r)
	})
}
