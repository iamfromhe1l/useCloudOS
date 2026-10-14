package server

import (
	"log/slog"
	"net/http"
	"runtime/debug"
	"time"
)

func New(addr string, handler http.Handler, logger *slog.Logger) *http.Server {
	return &http.Server{
		Addr:              addr,
		Handler:           recoverRequests(logRequests(handler, logger), logger),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
}

type responseRecorder struct {
	http.ResponseWriter
	status int
}
func(recorder *responseRecorder)Unwrap()http.ResponseWriter{return recorder.ResponseWriter}
func(recorder *responseRecorder)Flush(){if recorder.status==0{recorder.WriteHeader(200)};if flusher,ok:=recorder.ResponseWriter.(http.Flusher);ok{flusher.Flush()}}

func (recorder *responseRecorder) WriteHeader(status int) {
	recorder.status = status
	recorder.ResponseWriter.WriteHeader(status)
}

func (recorder *responseRecorder) Write(data []byte) (int, error) {
	if recorder.status == 0 {
		recorder.WriteHeader(http.StatusOK)
	}
	return recorder.ResponseWriter.Write(data)
}

func logRequests(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		start := time.Now()
		recorder := &responseRecorder{ResponseWriter: writer}
		next.ServeHTTP(recorder, request)
		if request.URL.Path == "/api/v1/health" {
			return
		}
		logger.InfoContext(request.Context(), "HTTP request",
			"method", request.Method,
			"path", request.URL.Path,
			"status", recorder.status,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}

func recoverRequests(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				logger.ErrorContext(request.Context(), "panic while serving request",
					"panic", recovered,
					"stack", string(debug.Stack()),
				)
				writer.Header().Set("Content-Type", "application/json")
				writer.WriteHeader(http.StatusInternalServerError)
				_, _ = writer.Write([]byte("{\"error\":{\"code\":\"INTERNAL_ERROR\",\"message\":\"internal server error\"}}\n"))
			}
		}()
		next.ServeHTTP(writer, request)
	})
}
