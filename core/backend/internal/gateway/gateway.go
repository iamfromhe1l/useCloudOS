package gateway

import (
	"context"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"net/http/httputil"
	"path"
	"path/filepath"
	"strings"
	"time"

	"usecloudos/backend/internal/auth"
	"usecloudos/backend/internal/manifest"
	"usecloudos/backend/internal/registry"
)

type Gateway struct {
	Repository registry.Repository
	SocketRoot string
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
		if errors.Is(err,registry.ErrNotFound){Error(w,404,"APP_NOT_FOUND","Application not installed")}else{Error(w,503,"REGISTRY_UNAVAILABLE","Application registry unavailable")}
		return
	}
	permission, ok := app.Manifest.RequiredPermission(r.Method, requestPath)
	if !ok || !app.Has(permission) || !auth.Allowed(auth.User(r.Context()), permission) {
		Error(w, 403, "PERMISSION_DENIED", "Application permission denied")
		return
	}
	if app.Manifest.Backend == nil || app.Status == "failed" || app.Status == "stopped" {
		Error(w, 503, "APP_UNAVAILABLE", "Application service unavailable")
		return
	}
	socket := filepath.Join(g.SocketRoot, app.Manifest.Metadata.ID, app.Manifest.Backend.Socket)
	transport := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{Timeout: 3 * time.Second}).DialContext(ctx, "unix", socket)
	}, ResponseHeaderTimeout: 40 * time.Second, DisableKeepAlives: true}
	defer transport.CloseIdleConnections()
	proxy := &httputil.ReverseProxy{Transport: transport, Rewrite: func(pr *httputil.ProxyRequest) {
		pr.Out.URL.Scheme = "http"
		pr.Out.URL.Host = "application"
		pr.Out.URL.Path = requestPath
		pr.Out.URL.RawPath = ""
		pr.Out.Host = "application"
		pr.Out.Header.Del("Cookie")
		pr.Out.Header.Del("Authorization")
		pr.Out.Header.Del("X-Usecloud-User")
		pr.Out.Header.Del("X-Usecloud-Role")
		pr.Out.Header.Set("X-Usecloud-User", auth.User(pr.In.Context()).ID)
	}, ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
		Error(w, 503, "APP_UNAVAILABLE", "Application service unavailable")
	}}
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	proxy.ServeHTTP(w, r)
}
