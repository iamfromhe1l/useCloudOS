// Package registrytest contains test fakes only. Production uses PostgreSQL.
package registrytest

import (
	"context"
	"sync"
	"usecloudos/backend/internal/manifest"
	"usecloudos/backend/internal/registry"
)

type Repository struct {
	mu   sync.Mutex
	Apps map[string]registry.Application
}

func New() *Repository { return &Repository{Apps: map[string]registry.Application{}} }
func (r *Repository) List(context.Context) ([]registry.Application, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	apps := []registry.Application{}
	for _, a := range r.Apps {
		apps = append(apps, a)
	}
	return apps, nil
}
func (r *Repository) Get(_ context.Context, id string) (registry.Application, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	a, ok := r.Apps[id]
	if !ok {
		return a, registry.ErrNotFound
	}
	return a, nil
}
func (r *Repository) Save(_ context.Context, a registry.Application) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.Apps[a.Manifest.Metadata.ID] = a
	return nil
}
func (r *Repository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.Apps, id)
	return nil
}
func (r *Repository) Event(context.Context, string, string, string) error { return nil }
func Manifest() manifest.Manifest {
	return manifest.Manifest{APIVersion: manifest.APIVersion, Kind: "App", Metadata: manifest.Metadata{ID: "example", Name: "Example", Version: "0.1.0", Author: "Tests"}, Platform: manifest.Platform{MinVersion: "0.1.0", HostVersion: 1}, Runtime: manifest.Runtime{Type: "native"}, Backend: &manifest.Backend{Type: "native", Executable: "backend/service", Socket: "example.sock", Routes: []manifest.Route{{Method: "GET", Path: "/items", Permission: "system.read"}, {Method: "POST", Path: "/items/*", Permission: "docker.manage"}}}, Permissions: []string{"system.read", "docker.manage"}, Navigation: manifest.Navigation{ColorRole: "primary"}}
}
