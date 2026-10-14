package api

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"usecloudos/apps/containers/internal/docker"
)

type fakeContainerService struct {
	info        docker.Info
	containers  []docker.Container
	details     docker.ContainerDetails
	stats       docker.ContainerStats
	logs        docker.Logs
	err         error
	operation   string
	containerID string
}

func (service *fakeContainerService) Info(context.Context) (docker.Info, error) {
	return service.info, service.err
}

func (service *fakeContainerService) Containers(context.Context) ([]docker.Container, error) {
	return service.containers, service.err
}

func (service *fakeContainerService) Container(_ context.Context, id string) (docker.ContainerDetails, error) {
	service.containerID = id
	return service.details, service.err
}

func (service *fakeContainerService) Start(_ context.Context, id string) error {
	service.operation, service.containerID = "start", id
	return service.err
}

func (service *fakeContainerService) Stop(_ context.Context, id string) error {
	service.operation, service.containerID = "stop", id
	return service.err
}

func (service *fakeContainerService) Restart(_ context.Context, id string) error {
	service.operation, service.containerID = "restart", id
	return service.err
}

func (service *fakeContainerService) Stats(_ context.Context, id string) (docker.ContainerStats, error) {
	service.containerID = id
	return service.stats, service.err
}

func (service *fakeContainerService) Logs(_ context.Context, id, _, _ string) (docker.Logs, error) {
	service.containerID = id
	return service.logs, service.err
}

func newDockerTestHandler(service ContainerService) http.Handler {
	return New(service, slog.New(slog.NewTextHandler(io.Discard, nil))).Handler()
}
func TestDockerEndpoints(t *testing.T) {
	service := &fakeContainerService{
		info:       docker.Info{Available: true, ServerVersion: "29.0"},
		containers: []docker.Container{{ID: "abc", Name: "demo"}},
		details:    docker.ContainerDetails{ID: "abc", Name: "demo"},
		stats:      docker.ContainerStats{CPUPercent: 2.5},
		logs:       docker.Logs{Logs: "hello\n"},
	}
	handler := newDockerTestHandler(service)
	tests := []struct {
		path string
		key  string
	}{
		{path: "/docker/info", key: "available"},
		{path: "/containers", key: "containers"},
		{path: "/containers/abc", key: "id"},
		{path: "/containers/abc/stats", key: "cpu_percent"},
		{path: "/containers/abc/logs?tail=20", key: "logs"},
	}
	for _, test := range tests {
		t.Run(test.path, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, test.path, nil)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)
			if response.Code != http.StatusOK {
				t.Fatalf("status = %d: %s", response.Code, response.Body.String())
			}
			var body map[string]any
			if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if _, ok := body[test.key]; !ok {
				t.Fatalf("response does not contain %q: %s", test.key, response.Body.String())
			}
		})
	}
}

func TestLifecycleHandlers(t *testing.T) {
	for _, operation := range []string{"start", "stop", "restart"} {
		t.Run(operation, func(t *testing.T) {
			service := &fakeContainerService{}
			request := httptest.NewRequest(http.MethodPost, "/containers/abc/"+operation, nil)
			response := httptest.NewRecorder()
			newDockerTestHandler(service).ServeHTTP(response, request)
			if response.Code != http.StatusNoContent {
				t.Fatalf("status = %d: %s", response.Code, response.Body.String())
			}
			if service.operation != operation || service.containerID != "abc" {
				t.Fatalf("operation = %q, id = %q", service.operation, service.containerID)
			}
		})
	}
}

func TestDockerDomainErrors(t *testing.T) {
	tests := []struct {
		name       string
		path       string
		method     string
		err        error
		wantStatus int
		wantCode   string
	}{
		{name: "not found", path: "/containers/missing", method: http.MethodGet, err: docker.ErrNotFound, wantStatus: 404, wantCode: "CONTAINER_NOT_FOUND"},
		{name: "unavailable", path: "/containers", method: http.MethodGet, err: docker.ErrUnavailable, wantStatus: 503, wantCode: "DOCKER_UNAVAILABLE"},
		{name: "conflict", path: "/containers/abc/start", method: http.MethodPost, err: docker.ErrConflict, wantStatus: 409, wantCode: "CONTAINER_STATE_CONFLICT"},
		{name: "invalid logs", path: "/containers/abc/logs?tail=all", method: http.MethodGet, err: docker.ErrInvalidArgument, wantStatus: 400, wantCode: "INVALID_REQUEST"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(test.method, test.path, nil)
			response := httptest.NewRecorder()
			newDockerTestHandler(&fakeContainerService{err: test.err}).ServeHTTP(response, request)
			if response.Code != test.wantStatus {
				t.Fatalf("status = %d: %s", response.Code, response.Body.String())
			}
			var body struct {
				Error struct {
					Code string `json:"code"`
				} `json:"error"`
			}
			if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if body.Error.Code != test.wantCode {
				t.Fatalf("code = %q", body.Error.Code)
			}
		})
	}
}
