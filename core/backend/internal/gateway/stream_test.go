package gateway

import (
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
	"usecloudos/backend/internal/auth"
	"usecloudos/backend/internal/manifest"
	"usecloudos/backend/internal/registry"
	"usecloudos/backend/internal/registrytest"
)

func TestProxyStreamsBeforeBodyCompletion(t *testing.T) {
	root, err := os.MkdirTemp("/tmp", "uc-stream-")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(root)
	_ = os.Mkdir(filepath.Join(root, "example"), 0750)
	listener, err := net.Listen("unix", filepath.Join(root, "example/example.sock"))
	if err != nil {
		t.Fatal(err)
	}
	started := make(chan struct{})
	release := make(chan struct{})
	service := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "PUT" {
			buffer := make([]byte, 5)
			if _, err := io.ReadFull(r.Body, buffer); err != nil {
				t.Error(err)
			}
			close(started)
			_, _ = io.Copy(io.Discard, r.Body)
			w.WriteHeader(204)
			return
		}
		_, _ = io.WriteString(w, "first")
		w.(http.Flusher).Flush()
		<-release
		_, _ = io.WriteString(w, "last")
	})}
	go service.Serve(listener)
	defer service.Close()
	repo := registrytest.New()
	m := registrytest.Manifest()
	m.Backend.Routes = append(m.Backend.Routes, manifest.Route{Method: "PUT", Path: "/stream", Permission: "system.read"})
	m.Backend.Routes = append(m.Backend.Routes, manifest.Route{Method: "GET", Path: "/stream", Permission: "system.read"})
	_ = repo.Save(context.Background(), registry.Application{Manifest: m, Status: "running", Grants: []string{"system.read"}})
	proxy := httptest.NewServer(auth.Auth{Development: true}.Protect(Gateway{Repository: repo, SocketRoot: root, AllowUntrusted: true}))
	defer proxy.Close()
	reader, writer := io.Pipe()
	request, _ := http.NewRequest("PUT", proxy.URL+"/api/apps/example/stream", reader)
	done := make(chan error, 1)
	go func() {
		response, err := http.DefaultClient.Do(request)
		if response != nil {
			response.Body.Close()
		}
		done <- err
	}()
	_, _ = writer.Write([]byte("first"))
	select {
	case <-started:
	case <-time.After(3 * time.Second):
		t.Fatal("gateway buffered upload")
	}
	writer.Close()
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	response, err := http.Get(proxy.URL + "/api/apps/example/stream")
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	buffer := make([]byte, 5)
	if _, err = io.ReadFull(response.Body, buffer); err != nil || string(buffer) != "first" {
		t.Fatal("gateway buffered download")
	}
	close(release)
}
