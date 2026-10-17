package platform

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"usecloudos/backend/internal/appmanager"
	"usecloudos/backend/internal/apppackage"
	"usecloudos/backend/internal/auth"
	"usecloudos/backend/internal/database"
	"usecloudos/backend/internal/gateway"
	"usecloudos/backend/internal/manifest"
	"usecloudos/backend/internal/registry"
)

type HTTP struct {
	Manager                 *appmanager.Manager
	Auth                    auth.Auth
	Database                *database.Database
	CatalogRoot, SocketRoot string
}

func JSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func (h HTTP) Bind(system http.Handler) http.Handler {
	protected := http.NewServeMux()
	protected.HandleFunc("GET /api/v1/session", func(w http.ResponseWriter, r *http.Request) { JSON(w, 200, auth.User(r.Context())) })
	protected.HandleFunc("GET /api/v1/sessions", h.Auth.Sessions)
	protected.HandleFunc("DELETE /api/v1/sessions", h.Auth.RevokeSessions)
	protected.HandleFunc("GET /api/v1/publishers", h.publishers)
	protected.HandleFunc("POST /api/v1/publishers", h.trustPublisher)
	protected.HandleFunc("DELETE /api/v1/publishers/{id}", h.revokePublisher)
	protected.HandleFunc("PUT /api/v1/apps/{id}/permissions/{permission}", h.permission)
	protected.HandleFunc("POST /api/v1/logout", h.Auth.Logout)
	protected.HandleFunc("GET /api/v1/apps", h.list)
	protected.HandleFunc("POST /api/v1/apps/inspect", h.inspect)
	protected.HandleFunc("POST /api/v1/apps/install", h.install)
	protected.HandleFunc("POST /api/v1/apps/update", h.update)
	protected.HandleFunc("POST /api/v1/apps/{id}/{action}", h.action)
	protected.HandleFunc("DELETE /api/v1/apps/{id}", h.uninstall)
	protected.HandleFunc("GET /api/v1/catalog", h.catalog)
	protected.HandleFunc("POST /api/v1/catalog/{id}/install", h.catalogInstall)
	protected.HandleFunc("POST /api/v1/catalog/{id}/update", h.catalogInstall)
	protected.HandleFunc("GET /api/v1/permissions", func(w http.ResponseWriter, r *http.Request) {
		JSON(w, 200, map[string]any{"version": manifest.PermissionVersion, "permissions": manifest.Permissions, "metadata": manifest.PermissionMetadata()})
	})
	protected.HandleFunc("GET /api/v1/notifications", h.notifications)
	protected.HandleFunc("GET /api/v1/events", h.events)
	protected.HandleFunc("POST /api/v1/apps/{id}/notifications", h.notify)
	protected.Handle("/api/apps/", gateway.Gateway{Repository: h.Manager.Repository, SocketRoot: h.SocketRoot, KeyAllowed: h.Database.KeyAllowed, Audit: h.Auth.Audit, AllowUntrusted: h.Manager.AllowUnsignedEmbedded})
	protected.HandleFunc("GET /app-assets/{id}/{version}/{asset...}", h.asset)
	protected.Handle("/", system)
	public := http.NewServeMux()
	public.HandleFunc("POST /api/v1/login", h.Auth.Login)
	public.HandleFunc("GET /api/v1/health", func(w http.ResponseWriter, r *http.Request) { system.ServeHTTP(w, r) })
	public.HandleFunc("GET /api/v1/version", func(w http.ResponseWriter, r *http.Request) { system.ServeHTTP(w, r) })
	public.Handle("/", h.Auth.Protect(protected))
	return public
}

func (h HTTP) events(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		gateway.Error(w, 503, "EVENTS_UNAVAILABLE", "Events unavailable")
		return
	}
	_ = http.NewResponseController(w).SetWriteDeadline(time.Time{})
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-store")
	channel, cancel := h.Manager.Bus.Subscribe()
	defer cancel()
	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()
	_, _ = fmt.Fprint(w, ": connected\n\n")
	flusher.Flush()
	for {
		select {
		case <-r.Context().Done():
			return
		case event := <-channel:
			data, _ := json.Marshal(event)
			if _, err := fmt.Fprintf(w, "data: %s\n\n", data); err != nil {
				return
			}
			flusher.Flush()
		case <-heartbeat.C:
			if _, err := fmt.Fprint(w, ": heartbeat\n\n"); err != nil {
				return
			}
			flusher.Flush()
		}
	}
}
func admin(w http.ResponseWriter, r *http.Request) bool {
	if auth.User(r.Context()).Role != "admin" {
		gateway.Error(w, 403, "PERMISSION_DENIED", "Administrator permission required")
		return false
	}
	return true
}
func (h HTTP) list(w http.ResponseWriter, r *http.Request) {
	apps, err := h.Manager.Repository.List(r.Context())
	if err != nil {
		gateway.Error(w, 503, "REGISTRY_UNAVAILABLE", "Application registry unavailable")
		return
	}
	for i := range apps {
		apps[i].Status = h.Manager.Runtime.Status(r.Context(), apps[i])
		if !h.Database.KeyAllowed(r.Context(), apps[i].PublisherKey) {
			apps[i].PublisherRevoked = true
			apps[i].Trust = "signed"
			apps[i].Status = "failed"
			apps[i].LastError = "Publisher key revoked or trust store unavailable"
		}
		apps[i].EffectivePermissions = []string{}
		for _, p := range apps[i].Grants {
			if auth.Allowed(auth.User(r.Context()), p) {
				apps[i].EffectivePermissions = append(apps[i].EffectivePermissions, p)
			}
		}
	}
	JSON(w, 200, map[string]any{"applications": apps, "systemApplications": []map[string]any{{"id": "home", "name": "Home", "route": "/", "icon": "home", "colorRole": "primary", "desktop": false, "dock": true}, {"id": "settings", "name": "Settings", "route": "/settings", "icon": "settings", "colorRole": "secondary", "desktop": true, "dock": true}, {"id": "store", "name": "Store", "route": "/store", "icon": "apps", "colorRole": "tertiary", "desktop": true, "dock": true}}})
}
func (h HTTP) readPackage(w http.ResponseWriter, r *http.Request) (*apppackage.Package, error) {
	r.Body = http.MaxBytesReader(w, r.Body, apppackage.MaxArchiveBytes)
	data, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	p, err := apppackage.Inspect(data)
	if err == nil {
		err = h.Database.ResolveTrust(r.Context(), p)
	}
	return p, err
}
func (h HTTP) inspect(w http.ResponseWriter, r *http.Request) {
	if !admin(w, r) {
		return
	}
	p, err := h.readPackage(w, r)
	if err != nil {
		gateway.Error(w, 400, "INVALID_PACKAGE", err.Error())
		return
	}
	JSON(w, 200, p)
}
func (h HTTP) install(w http.ResponseWriter, r *http.Request) {
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(4 * time.Minute))
	if !admin(w, r) {
		return
	}
	p, err := h.readPackage(w, r)
	if err != nil {
		gateway.Error(w, 400, "INVALID_PACKAGE", err.Error())
		return
	}
	app, err := h.Manager.Install(r.Context(), p, r.URL.Query().Get("confirm") == "1")
	if err != nil {
		slog.ErrorContext(r.Context(), "Application install failed", "error", err)
		gateway.Error(w, 409, "INSTALL_FAILED", "Application install failed. Check package trust, duplicates and platform logs.")
		return
	}
	h.Auth.Audit(r, "app.install", app.Manifest.Metadata.ID, "success")
	JSON(w, 201, app)
}
func (h HTTP) update(w http.ResponseWriter, r *http.Request) {
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(4 * time.Minute))
	if !admin(w, r) {
		return
	}
	p, err := h.readPackage(w, r)
	if err != nil {
		gateway.Error(w, 400, "INVALID_PACKAGE", err.Error())
		return
	}
	if err = h.Manager.Update(r.Context(), p, r.URL.Query().Get("confirm") == "1"); err != nil {
		gateway.Error(w, 409, "UPDATE_FAILED", "Application update failed or was rolled back")
		return
	}
	h.Auth.Audit(r, "app.update", p.Manifest.Metadata.ID, "success")
	w.WriteHeader(204)
}
func (h HTTP) action(w http.ResponseWriter, r *http.Request) {
	if !admin(w, r) {
		return
	}
	action := r.PathValue("action")
	if action != "start" && action != "stop" && action != "restart" {
		gateway.Error(w, 404, "NOT_FOUND", "Unknown application action")
		return
	}
	if err := h.Manager.Action(r.Context(), r.PathValue("id"), action); err != nil {
		status := 503
		if errors.Is(err, registry.ErrNotFound) {
			status = 404
		}
		gateway.Error(w, status, "APP_ACTION_FAILED", "Application operation failed")
		return
	}
	w.WriteHeader(204)
}
func (h HTTP) uninstall(w http.ResponseWriter, r *http.Request) {
	if !admin(w, r) {
		return
	}
	if r.URL.Query().Get("confirm") != "1" {
		gateway.Error(w, 400, "CONFIRM_REQUIRED", "Explicit removal confirmation required")
		return
	}
	err := h.Manager.Uninstall(r.Context(), r.PathValue("id"), r.URL.Query().Get("purgeData") == "1")
	if err != nil {
		gateway.Error(w, 409, "UNINSTALL_FAILED", "Application removal failed")
		return
	}
	h.Auth.Audit(r, "app.uninstall", r.PathValue("id"), "success")
	w.WriteHeader(204)
}
func (h HTTP) asset(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	asset := r.PathValue("asset")
	if !manifest.ValidID(id) || !manifest.SafePath(asset) || !strings.HasPrefix(asset, "frontend/") && !strings.HasPrefix(asset, "assets/") {
		http.NotFound(w, r)
		return
	}
	app, err := h.Manager.Repository.Get(r.Context(), id)
	if err != nil || app.Manifest.Metadata.Version != r.PathValue("version") {
		http.NotFound(w, r)
		return
	}
	if strings.HasPrefix(asset, "assets/") && asset != app.Manifest.Navigation.Icon {
		http.NotFound(w, r)
		return
	}
	// Web components are not a sandbox: unsigned bundles need an explicit dev policy.
	if !h.Database.KeyAllowed(r.Context(), app.PublisherKey) {
		gateway.Error(w, 403, "PUBLISHER_REVOKED", "Publisher revoked")
		return
	}
	if strings.HasPrefix(asset, "frontend/") && app.Trust != "verified" && !h.Manager.AllowUnsignedEmbedded {
		gateway.Error(w, 403, "UNTRUSTED_FRONTEND", "Embedded frontend is not trusted")
		return
	}
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "private, max-age=31536000, immutable")
	http.ServeFile(w, r, filepath.Join(app.InstallPath, filepath.FromSlash(asset)))
}
func (h HTTP) catalog(w http.ResponseWriter, r *http.Request) {
	result := []any{}
	entries, _ := os.ReadDir(h.CatalogRoot)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".usecloud") {
			continue
		}
		info, err := entry.Info()
		if err != nil || info.Size() > apppackage.MaxArchiveBytes {
			continue
		}
		data, err := os.ReadFile(filepath.Join(h.CatalogRoot, entry.Name()))
		if err != nil {
			continue
		}
		p, err := apppackage.Inspect(data)
		if err == nil {
			err = h.Database.ResolveTrust(r.Context(), p)
		}
		if err == nil {
			result = append(result, p)
		}
	}
	JSON(w, 200, map[string]any{"applications": result, "source": "local"})
}
func (h HTTP) catalogInstall(w http.ResponseWriter, r *http.Request) {
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(4 * time.Minute))
	if !admin(w, r) {
		return
	}
	id := r.PathValue("id")
	if !manifest.ValidID(id) {
		http.NotFound(w, r)
		return
	}
	entries, _ := os.ReadDir(h.CatalogRoot)
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".usecloud") {
			continue
		}
		info, err := e.Info()
		if err != nil || info.Size() > apppackage.MaxArchiveBytes {
			continue
		}
		data, err := os.ReadFile(filepath.Join(h.CatalogRoot, e.Name()))
		if err != nil {
			continue
		}
		p, err := apppackage.Inspect(data)
		if err == nil {
			err = h.Database.ResolveTrust(r.Context(), p)
		}
		if err == nil && p.Manifest.Metadata.ID == id {
			if strings.HasSuffix(r.URL.Path, "/update") {
				if err = h.Manager.Update(r.Context(), p, r.URL.Query().Get("confirm") == "1"); err != nil {
					gateway.Error(w, 409, "UPDATE_FAILED", "Application update failed or was rolled back")
					return
				}
				w.WriteHeader(204)
				return
			}
			app, err := h.Manager.Install(r.Context(), p, r.URL.Query().Get("confirm") == "1")
			if err != nil {
				slog.ErrorContext(r.Context(), "Catalog install failed", "error", err)
				gateway.Error(w, 409, "INSTALL_FAILED", "Application install failed. Check package trust, duplicates and platform logs.")
				return
			}
			JSON(w, 201, app)
			return
		}
	}
	gateway.Error(w, 404, "NOT_FOUND", "Catalog package not found")
}
func (h HTTP) notifications(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Database.Pool.Query(r.Context(), "SELECT id,app_id,message,created_at FROM notifications WHERE user_id=$1 OR user_id IS NULL ORDER BY id DESC LIMIT 50", auth.User(r.Context()).ID)
	if err != nil {
		gateway.Error(w, 503, "NOTIFICATIONS_UNAVAILABLE", "Notifications unavailable")
		return
	}
	defer rows.Close()
	result := []map[string]any{}
	for rows.Next() {
		var id int64
		var appID, message string
		var created any
		if err = rows.Scan(&id, &appID, &message, &created); err != nil {
			gateway.Error(w, 500, "NOTIFICATIONS_UNAVAILABLE", "Notifications unavailable")
			return
		}
		result = append(result, map[string]any{"id": id, "appId": appID, "message": message, "createdAt": created})
	}
	JSON(w, 200, map[string]any{"notifications": result})
}
func (h HTTP) notify(w http.ResponseWriter, r *http.Request) {
	app, err := h.Manager.Repository.Get(r.Context(), r.PathValue("id"))
	if err != nil || !app.Has("notifications.send") || !auth.Allowed(auth.User(r.Context()), "notifications.send") {
		gateway.Error(w, 403, "PERMISSION_DENIED", "Notification permission denied")
		return
	}
	var input struct {
		Message string `json:"message"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	if json.NewDecoder(r.Body).Decode(&input) != nil || input.Message == "" || len(input.Message) > 1000 {
		gateway.Error(w, 400, "INVALID_REQUEST", "Invalid notification")
		return
	}
	_, err = h.Database.Pool.Exec(r.Context(), "INSERT INTO notifications(app_id,message)VALUES($1,$2)", app.Manifest.Metadata.ID, input.Message)
	if err != nil {
		gateway.Error(w, 503, "NOTIFICATIONS_UNAVAILABLE", "Notifications unavailable")
		return
	}
	w.WriteHeader(204)
}
