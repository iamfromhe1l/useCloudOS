package api

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"usecloudos/backend/internal/buildinfo"
	"usecloudos/backend/internal/system"
)

type SystemService interface {
	Info(context.Context) (system.Info, error)
	Resources(context.Context) (system.Resources, error)
	Filesystems(context.Context) ([]system.Filesystem, error)
}

type API struct {
	systemService SystemService
	logger        *slog.Logger
	version       buildinfo.Info
}

func New(systemService SystemService, logger *slog.Logger, version buildinfo.Info) *API {
	return &API{
		systemService: systemService,
		logger:        logger,
		version:       version,
	}
}

func (a *API) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/health", a.getOnly(a.health))
	mux.HandleFunc("/api/v1/version", a.getOnly(a.getVersion))
	mux.HandleFunc("/api/v1/system/info", a.getOnly(a.systemInfo))
	mux.HandleFunc("/api/v1/system/resources", a.getOnly(a.systemResources))
	mux.HandleFunc("/api/v1/storage/filesystems", a.getOnly(a.filesystems))
	mux.HandleFunc("/api/v1/", func(writer http.ResponseWriter, _ *http.Request) {
		writeError(writer, http.StatusNotFound, "NOT_FOUND", "API endpoint not found")
	})
	return mux
}

func (a *API) health(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, map[string]string{"status": "ok"})
}

func (a *API) getVersion(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, a.version)
}

func (a *API) systemInfo(writer http.ResponseWriter, request *http.Request) {
	info, err := a.systemService.Info(request.Context())
	if err != nil {
		a.logger.ErrorContext(request.Context(), "failed to read system information", "error", err)
		writeError(writer, http.StatusInternalServerError, "SYSTEM_INFO_UNAVAILABLE", "failed to read system information")
		return
	}
	writeJSON(writer, http.StatusOK, info)
}

func (a *API) systemResources(writer http.ResponseWriter, request *http.Request) {
	resources, err := a.systemService.Resources(request.Context())
	if err != nil {
		a.logger.ErrorContext(request.Context(), "failed to read system resources", "error", err)
		writeError(writer, http.StatusInternalServerError, "SYSTEM_RESOURCES_UNAVAILABLE", "failed to read system resources")
		return
	}
	writeJSON(writer, http.StatusOK, resources)
}

func (a *API) filesystems(writer http.ResponseWriter, request *http.Request) {
	filesystems, err := a.systemService.Filesystems(request.Context())
	if err != nil {
		a.logger.ErrorContext(request.Context(), "failed to read filesystems", "error", err)
		writeError(writer, http.StatusInternalServerError, "FILESYSTEMS_UNAVAILABLE", "failed to read filesystem information")
		return
	}
	writeJSON(writer, http.StatusOK, map[string][]system.Filesystem{"filesystems": filesystems})
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
