package api

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"usecloudos/apps/containers/internal/docker"
)

type ContainerService interface {
	Info(context.Context) (docker.Info, error)
	Containers(context.Context) ([]docker.Container, error)
	Container(context.Context, string) (docker.ContainerDetails, error)
	Start(context.Context, string) error
	Stop(context.Context, string) error
	Restart(context.Context, string) error
	Stats(context.Context, string) (docker.ContainerStats, error)
	Logs(context.Context, string, string, string) (docker.Logs, error)
}

type API struct {
	containerService ContainerService
	logger           *slog.Logger
}

func New(service ContainerService, logger *slog.Logger) *API { return &API{service, logger} }
func (a *API) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, 200, map[string]string{"status": "ok"}) })
	mux.HandleFunc("/docker/info", a.getOnly(a.dockerInfo))
	mux.HandleFunc("/containers", a.getOnly(a.containers))
	mux.HandleFunc("/containers/", a.containerRoute)
	return mux
}
func (a *API) dockerInfo(writer http.ResponseWriter, request *http.Request) {
	info, err := a.containerService.Info(request.Context())
	if err != nil {
		a.writeDockerError(writer, request, err)
		return
	}
	writeJSON(writer, http.StatusOK, info)
}

func (a *API) containers(writer http.ResponseWriter, request *http.Request) {
	containers, err := a.containerService.Containers(request.Context())
	if err != nil {
		a.writeDockerError(writer, request, err)
		return
	}
	writeJSON(writer, http.StatusOK, map[string][]docker.Container{"containers": containers})
}

func (a *API) containerRoute(writer http.ResponseWriter, request *http.Request) {
	path := strings.TrimPrefix(request.URL.Path, "/containers/")
	parts := strings.Split(path, "/")
	if len(parts) == 0 || parts[0] == "" || len(parts) > 2 {
		writeError(writer, http.StatusNotFound, "NOT_FOUND", "API endpoint not found")
		return
	}
	id := parts[0]
	if len(parts) == 1 {
		if request.Method != http.MethodGet {
			writeMethodNotAllowed(writer, http.MethodGet)
			return
		}
		details, err := a.containerService.Container(request.Context(), id)
		if err != nil {
			a.writeDockerError(writer, request, err)
			return
		}
		writeJSON(writer, http.StatusOK, details)
		return
	}

	action := parts[1]
	switch action {
	case "stats":
		if request.Method != http.MethodGet {
			writeMethodNotAllowed(writer, http.MethodGet)
			return
		}
		stats, err := a.containerService.Stats(request.Context(), id)
		if err != nil {
			a.writeDockerError(writer, request, err)
			return
		}
		writeJSON(writer, http.StatusOK, stats)
	case "logs":
		if request.Method != http.MethodGet {
			writeMethodNotAllowed(writer, http.MethodGet)
			return
		}
		logs, err := a.containerService.Logs(request.Context(), id, request.URL.Query().Get("tail"), request.URL.Query().Get("since"))
		if err != nil {
			a.writeDockerError(writer, request, err)
			return
		}
		writeJSON(writer, http.StatusOK, logs)
	case "start", "stop", "restart":
		if request.Method != http.MethodPost {
			writeMethodNotAllowed(writer, http.MethodPost)
			return
		}
		var err error
		switch action {
		case "start":
			err = a.containerService.Start(request.Context(), id)
		case "stop":
			err = a.containerService.Stop(request.Context(), id)
		case "restart":
			err = a.containerService.Restart(request.Context(), id)
		}
		if err != nil {
			a.writeDockerError(writer, request, err)
			return
		}
		writer.WriteHeader(http.StatusNoContent)
	default:
		writeError(writer, http.StatusNotFound, "NOT_FOUND", "API endpoint not found")
	}
}

func (a *API) writeDockerError(writer http.ResponseWriter, request *http.Request, err error) {
	a.logger.ErrorContext(request.Context(), "Docker operation failed", "error", err, "path", request.URL.Path)
	switch {
	case errors.Is(err, docker.ErrNotFound):
		writeError(writer, http.StatusNotFound, "CONTAINER_NOT_FOUND", "container not found")
	case errors.Is(err, docker.ErrConflict):
		writeError(writer, http.StatusConflict, "CONTAINER_STATE_CONFLICT", "container state does not allow this operation")
	case errors.Is(err, docker.ErrUnavailable):
		writeError(writer, http.StatusServiceUnavailable, "DOCKER_UNAVAILABLE", "Docker Engine is unavailable")
	case errors.Is(err, docker.ErrInvalidArgument):
		writeError(writer, http.StatusBadRequest, "INVALID_REQUEST", "invalid request parameters")
	default:
		writeError(writer, http.StatusInternalServerError, "DOCKER_OPERATION_FAILED", "Docker operation failed")
	}
}

func (a *API) getOnly(handler http.HandlerFunc) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodGet {
			writeMethodNotAllowed(writer, http.MethodGet)
			return
		}
		handler(writer, request)
	}
}

func writeMethodNotAllowed(writer http.ResponseWriter, allowed string) {
	writer.Header().Set("Allow", allowed)
	writeError(writer, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
}

func writeJSON(writer http.ResponseWriter, status int, value any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(value); err != nil {
		// The response is already committed. Request middleware will record the
		// status; the error cannot safely be exposed to the client here.
		return
	}
}

func writeError(writer http.ResponseWriter, status int, code, message string) {
	writeJSON(writer, status, struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}{Error: struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}{Code: code, Message: message}})
}
