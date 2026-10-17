package appruntime

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"usecloudos/backend/internal/registry"
	"usecloudos/backend/internal/registrytest"
)

type roundTrip func(*http.Request) (*http.Response, error)

func (f roundTrip) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func TestOCILifecycleAndPolicy(t *testing.T) {
	a := registrytest.Manifest()
	a.Runtime.Type = "container"
	a.Runtime.Image = "example/service:1.0.0"
	a.Backend = nil
	installed := false
	running := false
	creates := 0
	runtime := OCI{Client: &http.Client{Transport: roundTrip(func(r *http.Request) (*http.Response, error) {
		w := httptest.NewRecorder()
		switch {
		case r.URL.Path == "/version":
			_, _ = w.Write([]byte(`{"ApiVersion":"1.56"}`))
		case strings.HasSuffix(r.URL.Path, "/json") && strings.Contains(r.URL.Path, "/containers/"):
			if !installed {
				w.WriteHeader(404)
			} else {
				_ = json.NewEncoder(w).Encode(map[string]any{"Config": map[string]any{"Labels": map[string]string{"io.usecloud.app": "example", "io.usecloud.version": "0.1.0"}}, "State": map[string]any{"Running": running}})
			}
		case strings.Contains(r.URL.Path, "/images/"):
			if r.Method != "GET" {
				t.Error("cached image was pulled")
			}
			_, _ = w.Write([]byte(`{}`))
		case strings.HasSuffix(r.URL.Path, "/containers/create"):
			creates++
			var payload struct {
				HostConfig struct {
					Privileged  bool
					NetworkMode string
					CapDrop     []string
					Binds       []string
					Mounts      []any
				}
			}
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				t.Fatal(err)
			}
			if payload.HostConfig.Privileged || payload.HostConfig.NetworkMode != "none" || len(payload.HostConfig.CapDrop) != 1 || payload.HostConfig.CapDrop[0] != "ALL" || len(payload.HostConfig.Binds) != 0 || len(payload.HostConfig.Mounts) != 0 {
				t.Fatal("unsafe OCI creation defaults")
			}
			installed = true
			w.WriteHeader(201)
		case strings.HasSuffix(r.URL.Path, "/start"):
			running = true
			w.WriteHeader(204)
		case strings.HasSuffix(r.URL.Path, "/stop"):
			running = false
			w.WriteHeader(204)
		case r.Method == "DELETE":
			installed = false
			w.WriteHeader(204)
		default:
			t.Errorf("unexpected OCI request %s %s", r.Method, r.URL.Path)
			w.WriteHeader(500)
		}
		return w.Result(), nil
	})}}
	record := registry.Application{Manifest: a}
	ctx := context.Background()
	if err := runtime.Start(ctx, record); err != nil {
		t.Fatal(err)
	}
	if runtime.Status(ctx, record) != "running" {
		t.Fatal("status")
	}
	if err := runtime.Start(ctx, record); err != nil || creates != 1 {
		t.Fatal("not idempotent")
	}
	if err := runtime.Stop(ctx, record); err != nil {
		t.Fatal(err)
	}
	if err := runtime.Remove(ctx, record); err != nil || installed {
		t.Fatal("not removed")
	}
}

func TestOCIRefusesForeignContainer(t *testing.T) {
	a := registry.Application{Manifest: registrytest.Manifest()}
	runtime := OCI{Client: &http.Client{Transport: roundTrip(func(r *http.Request) (*http.Response, error) {
		w := httptest.NewRecorder()
		if r.Method != http.MethodGet {
			t.Fatalf("foreign container mutated: %s %s", r.Method, r.URL.Path)
		}
		if r.URL.Path == "/version" {
			_, _ = w.Write([]byte(`{"ApiVersion":"1.56"}`))
		} else {
			_, _ = w.Write([]byte(`{"Config":{"Labels":{"io.usecloud.app":"someone-else"}}}`))
		}
		return w.Result(), nil
	})}}
	for _, operation := range []func(context.Context, registry.Application) error{runtime.Start, runtime.Stop, runtime.Remove} {
		if err := operation(context.Background(), a); err == nil {
			t.Fatal("foreign ownership accepted")
		}
	}
}
