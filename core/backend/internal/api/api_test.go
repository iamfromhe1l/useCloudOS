package api

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"usecloudos/backend/internal/buildinfo"
	"usecloudos/backend/internal/system"
)

type fakeSystemService struct {
	info        system.Info
	resources   system.Resources
	filesystems []system.Filesystem
	err         error
}

func (service *fakeSystemService) Info(context.Context) (system.Info, error) {
	return service.info, service.err
}

func (service *fakeSystemService) Resources(context.Context) (system.Resources, error) {
	return service.resources, service.err
}

func (service *fakeSystemService) Filesystems(context.Context) ([]system.Filesystem, error) {
	return service.filesystems, service.err
}

func newTestHandler(service SystemService) http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return New(service, logger, buildinfo.Info{Version: "test", Commit: "abc", BuildTime: "now"}).Handler()
}

func TestHealth(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	response := httptest.NewRecorder()
	newTestHandler(&fakeSystemService{}).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d", response.Code)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "application/json" {
		t.Fatalf("Content-Type = %q", contentType)
	}
	if response.Body.String() != "{\"status\":\"ok\"}\n" {
		t.Fatalf("body = %q", response.Body.String())
	}
}

func TestSystemEndpoints(t *testing.T) {
	service := &fakeSystemService{
		info: system.Info{Hostname: "usecloud-dev", OS: system.OSInfo{Name: "Debian GNU/Linux", Version: "13"}},
		resources: system.Resources{
			CPU:    system.CPU{LogicalCores: 4, UsagePercent: 12.5},
			Memory: system.Memory{TotalBytes: 100, AvailableBytes: 60, UsedBytes: 40, UsagePercent: 40},
		},
		filesystems: []system.Filesystem{{MountPoint: "/", Filesystem: "ext4", TotalBytes: 100}},
	}
	handler := newTestHandler(service)

	tests := []struct {
		path string
		key  string
	}{
		{path: "/api/v1/system/info", key: "hostname"},
		{path: "/api/v1/system/resources", key: "cpu"},
		{path: "/api/v1/storage/filesystems", key: "filesystems"},
		{path: "/api/v1/version", key: "version"},
	}
	for _, test := range tests {
		t.Run(test.path, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, test.path, nil)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)
			if response.Code != http.StatusOK {
				t.Fatalf("status = %d", response.Code)
			}
			var body map[string]any
			if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if _, ok := body[test.key]; !ok {
				t.Fatalf("response does not contain %q: %s", test.key, response.Body.String())
			}
		})
	}
}

func TestServiceErrorUsesPublicErrorEnvelope(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/v1/system/info", nil)
	response := httptest.NewRecorder()
	newTestHandler(&fakeSystemService{err: errors.New("sensitive internal detail")}).ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", response.Code)
	}
	if body := response.Body.String(); body != "{\"error\":{\"code\":\"SYSTEM_INFO_UNAVAILABLE\",\"message\":\"failed to read system information\"}}\n" {
		t.Fatalf("body = %q", body)
	}
}

func TestMethodNotAllowedUsesJSON(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/api/v1/health", nil)
	response := httptest.NewRecorder()
	newTestHandler(&fakeSystemService{}).ServeHTTP(response, request)

	if response.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d", response.Code)
	}
	if response.Header().Get("Allow") != http.MethodGet {
		t.Fatalf("Allow = %q", response.Header().Get("Allow"))
	}
}

func TestUnknownAPIEndpointUsesJSON(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/v1/unknown", nil)
	response := httptest.NewRecorder()
	newTestHandler(&fakeSystemService{}).ServeHTTP(response, request)

	if response.Code != http.StatusNotFound {
		t.Fatalf("status = %d", response.Code)
	}
	if response.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("Content-Type = %q", response.Header().Get("Content-Type"))
	}
}
