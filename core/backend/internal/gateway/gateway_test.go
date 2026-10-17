package gateway

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"usecloudos/backend/internal/auth"
	"usecloudos/backend/internal/registry"
	"usecloudos/backend/internal/registrytest"
)

func TestSocketProxyPermissionsAndFailure(t *testing.T) {
	root, err := os.MkdirTemp("/tmp", "uc-gw-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(root) })
	_ = os.Mkdir(filepath.Join(root, "example"), 0750)
	listener, err := net.Listen("unix", filepath.Join(root, "example/example.sock"))
	if err != nil {
		t.Fatal(err)
	}
	service := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/items" || r.Header.Get("X-Usecloud-User") != "development" || r.Header.Get("Cookie") != "" {
			t.Error("invalid upstream request")
		}
		w.WriteHeader(200)
	})}
	go service.Serve(listener)
	defer service.Close()
	repository := registrytest.New()
	a := registry.Application{Manifest: registrytest.Manifest(), Status: "running", Grants: []string{"system.read"}}
	_ = repository.Save(context.Background(), a)
	handler := auth.Auth{Development: true}.Protect(Gateway{Repository: repository, SocketRoot: root, AllowUntrusted: true})
	for _, test := range []struct {
		method, path string
		status       int
	}{{"GET", "/api/apps/example/items", 200}, {"POST", "/api/apps/example/items/1", 403}, {"GET", "/api/apps/missing/items", 404}, {"GET", "/api/apps/example/secret", 403}, {"GET", "/api/apps/example/items/../secret", 400}} {
		r := httptest.NewRequest(test.method, "http://localhost"+test.path, nil)
		r.RemoteAddr = "127.0.0.1:1234"
		r.Header.Set("X-Usecloud-User", "forged")
		r.Header.Set("Cookie", "private=secret")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
		if w.Code != test.status {
			t.Errorf("%s: %d want %d", test.path, w.Code, test.status)
		}
	}
	service.Close()
	r := httptest.NewRequest("GET", "http://localhost/api/apps/example/items", nil)
	r.RemoteAddr = "127.0.0.1:1"
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)
	if w.Code != 503 {
		t.Fatal("service crash not isolated")
	}
}
