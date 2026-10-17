//go:build linux

package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
	"usecloudos/apps/files/internal/files"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	if err := run(); err != nil {
		slog.Error("files-service stopped", "error", err)
		os.Exit(1)
	}
}
func run() error {
	root := os.Getenv("USECLOUD_STORAGE_ROOT")
	socket := os.Getenv("USECLOUD_APP_SOCKET")
	if root == "" || socket == "" {
		return errors.New("platform storage root and Unix socket are required")
	}
	max := int64(2 << 30)
	if value := os.Getenv("USECLOUD_MAX_UPLOAD_BYTES"); value != "" {
		n, err := strconv.ParseInt(value, 10, 64)
		if err != nil || n < 1 || n > 10<<30 {
			return errors.New("invalid upload limit")
		}
		max = n
	}
	service, err := files.New(root, os.Getenv("USECLOUD_STORAGE_WRITE") == "1", max)
	if err != nil {
		return err
	}
	defer service.Close()
	if active, err := net.DialTimeout("unix", socket, time.Second); err == nil {
		active.Close()
		return errors.New("socket already active")
	}
	if err := os.Remove(socket); err != nil && !os.IsNotExist(err) {
		return err
	}
	listener, err := net.Listen("unix", socket)
	if err != nil {
		return err
	}
	defer os.Remove(socket)
	if err = os.Chmod(socket, 0660); err != nil {
		return err
	}
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()
	server := &http.Server{Handler: service.Handler(), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second, BaseContext: func(net.Listener) context.Context { return ctx }}
	done := make(chan error, 1)
	go func() { done <- server.Serve(listener) }()
	slog.Info("files-service ready", "transport", "unix", "writable", service.Writable)
	select {
	case err := <-done:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
		shutdown, stop := context.WithTimeout(context.Background(), 10*time.Second)
		defer stop()
		return server.Shutdown(shutdown)
	}
	return nil
}
