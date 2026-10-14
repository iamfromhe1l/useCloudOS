// containers-service owns Docker business logic. Only Core may reach its socket.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"

	"usecloudos/apps/containers/internal/api"
	"usecloudos/apps/containers/internal/docker"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(logger); err != nil {
		logger.Error("containers-service stopped", "error", err)
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	if runtime.GOOS != "linux" {
		return errors.New("containers-service requires Linux")
	}
	// The manager sets this only after checking the installed capability grant.
	// This is deployment configuration, not a sandbox: see Docker socket security.
	if os.Getenv("USECLOUD_DOCKER_GRANTED") != "1" {
		return errors.New("docker capability has not been granted by the platform")
	}
	socket := os.Getenv("USECLOUD_APP_SOCKET")
	if socket == "" {
		socket = "/run/usecloud/apps/containers.sock"
	}
	if err := os.MkdirAll(filepath.Dir(socket), 0750); err != nil {
		return err
	}
	if info, err := os.Lstat(socket); err == nil {
		if info.Mode()&os.ModeSocket == 0 {
			return errors.New("refusing to replace non-socket path")
		}
		if err := os.Remove(socket); err != nil {
			return err
		}
	}
	listener, err := net.Listen("unix", socket)
	if err != nil {
		return err
	}
	defer listener.Close()
	defer os.Remove(socket)
	if err := os.Chmod(socket, 0660); err != nil {
		return err
	}
	provider, err := docker.NewMobyProvider()
	if err != nil {
		return err
	}
	defer provider.Close()
	service := &http.Server{Handler: api.New(docker.NewService(provider), logger).Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 45 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	result := make(chan error, 1)
	go func() {
		logger.Info("starting containers-service", "socket", socket)
		result <- service.Serve(listener)
	}()
	select {
	case err := <-result:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return service.Shutdown(shutdown)
}
