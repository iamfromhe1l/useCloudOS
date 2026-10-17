package gateway

import (
	"context"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"net/http/httputil"
	"os"
	"path"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"usecloudos/backend/internal/auth"
	"usecloudos/backend/internal/manifest"
	"usecloudos/backend/internal/registry"
)

type Gateway struct {
	Repository     registry.Repository
	SocketRoot     string
	KeyAllowed     func(context.Context, string) bool
	Audit          func(*http.Request, string, string, string)
	AllowUntrusted bool
}

func Error(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{"error": map[string]string{"code": code, "message": message}})
}
func (g Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	suffix := strings.TrimPrefix(r.URL.Path, "/api/apps/")
	parts := strings.SplitN(suffix, "/", 2)
	if len(parts) != 2 || !manifest.ValidID(parts[0]) {
		Error(w, 404, "APP_NOT_FOUND", "Application not found")
		return
	}
	requestPath := "/" + parts[1]
	if path.Clean(requestPath) != requestPath || strings.Contains(requestPath, "\\") {
		Error(w, 400, "INVALID_PATH", "Invalid application path")
		return
	}
	app, err := g.Repository.Get(r.Context(), parts[0])
	if err != nil {
		if errors.Is(err, registry.ErrNotFound) {
			Error(w, 404, "APP_NOT_FOUND", "Application not installed")
		} else {
			Error(w, 503, "REGISTRY_UNAVAILABLE", "Application registry unavailable")
		}
		return
	}
	permission, ok := app.Manifest.RequiredPermission(r.Method, requestPath)
	if !ok || !app.Has(permission) || !auth.Allowed(auth.User(r.Context()), permission) {
		if g.Audit != nil {
			g.Audit(r, "app.request.denied", parts[0], "denied")
		}
		Error(w, 403, "PERMISSION_DENIED", "Application permission denied")
		return
	}
	if g.KeyAllowed != nil && !g.KeyAllowed(r.Context(), app.PublisherKey) {
		Error(w, 403, "PUBLISHER_REVOKED", "Application publisher key revoked")
		return
	}
	if !g.AllowUntrusted && (app.Trust != "verified" || app.PublisherKey == "") {
		Error(w, 403, "UNTRUSTED_APPLICATION", "Application is not trusted under current platform policy")
		return
	}
	if app.Manifest.Backend == nil || app.Status == "failed" || app.Status == "stopped" {
		Error(w, 503, "APP_UNAVAILABLE", "Application service unavailable")
		return
	}
	socket := filepath.Join(g.SocketRoot, app.Manifest.Metadata.ID, app.Manifest.Backend.Socket)
	if app.Manifest.Runtime.Type != "native" || app.Manifest.Backend.Type != "native" || app.Manifest.Backend.Socket != app.Manifest.Metadata.ID+".sock" {
		Error(w, 503, "APP_UNAVAILABLE", "Invalid service metadata")
		return
	}
	info, err := os.Lstat(socket)
	if err != nil || info.Mode()&os.ModeSocket == 0 || info.Mode().Perm()&0002 != 0 {
		Error(w, 503, "APP_UNAVAILABLE", "Application socket unavailable")
		return
	}
	parent, err := os.Lstat(filepath.Dir(socket))
	if err != nil || !parent.IsDir() || parent.Mode().Perm()&0007 != 0 {
		Error(w, 503, "APP_UNAVAILABLE", "Unsafe service directory")
		return
	}
	owner, okOwner := info.Sys().(*syscall.Stat_t)
	directoryOwner, okDirectory := parent.Sys().(*syscall.Stat_t)
	if !okOwner || !okDirectory || owner.Uid != directoryOwner.Uid {
		Error(w, 503, "APP_UNAVAILABLE", "Invalid socket owner")
		return
	}
	transport := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{Timeout: 3 * time.Second}).DialContext(ctx, "unix", socket)
	}, ResponseHeaderTimeout: 40 * time.Second, DisableKeepAlives: true}
	defer transport.CloseIdleConnections()
	proxy := &httputil.ReverseProxy{Transport: transport, ModifyResponse: func(response *http.Response) error {
		if r.Method != "GET" && response.StatusCode >= 400 && g.Audit != nil {
			g.Audit(r, "app.operation.failed", parts[0], "failed")
		}
		return nil
	}, Rewrite: func(pr *httputil.ProxyRequest) {
		pr.Out.URL.Scheme = "http"
		pr.Out.URL.Host = "application"
		pr.Out.URL.Path = requestPath
		pr.Out.URL.RawPath = ""
		pr.Out.Host = "application"
		pr.Out.Header.Del("Cookie")
		pr.Out.Header.Del("Authorization")
		pr.Out.Header.Del("X-Usecloud-User")
		pr.Out.Header.Del("X-Usecloud-Role")
		pr.Out.Header.Del("X-Usecloud-Permissions")
		pr.Out.Header.Set("X-Usecloud-User", auth.User(pr.In.Context()).ID)
		pr.Out.Header.Set("X-Usecloud-Permissions", strings.Join(app.Grants, ","))
	}, ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
		Error(w, 503, "APP_UNAVAILABLE", "Application service unavailable")
	}}
	// Stream directly. The app enforces domain size/concurrency limits. Core
	// retains a global 10 GiB ceiling and permits long, bounded file transfers.
	r.Body = http.MaxBytesReader(w, r.Body, (10<<30)+1)
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(30 * time.Minute))
	_ = http.NewResponseController(w).SetReadDeadline(time.Now().Add(30 * time.Minute))
	proxy.ServeHTTP(w, r)
}
