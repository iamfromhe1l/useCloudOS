package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"usecloudos/backend/internal/api"
	"usecloudos/backend/internal/appmanager"
	"usecloudos/backend/internal/appruntime"
	"usecloudos/backend/internal/auth"
	"usecloudos/backend/internal/buildinfo"
	"usecloudos/backend/internal/database"
	"usecloudos/backend/internal/events"
	"usecloudos/backend/internal/platform"
	"usecloudos/backend/internal/server"
	"usecloudos/backend/internal/system"
)

const defaultAddress = "0.0.0.0:8080"

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(logger); err != nil {
		logger.Error("cloud-core stopped", "error", err)
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	provider, err := system.NewLinuxProvider()
	if err != nil {
		return err
	}
	systemService := system.NewService(provider)
	dbContext, cancelDB := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancelDB()
	db, err := database.Open(dbContext, os.Getenv("CLOUD_CORE_DATABASE_URL"))
	if err != nil {
		return err
	}
	defer db.Pool.Close()
	authentication := auth.Auth{Pool: db.Pool, Development: os.Getenv("CLOUD_CORE_DEV_AUTH") == "1", SecureCookie: os.Getenv("CLOUD_CORE_SECURE_COOKIE") != "0"}
	if err := authentication.Bootstrap(dbContext, os.Getenv("CLOUD_CORE_BOOTSTRAP_PASSWORD")); err != nil {
		return err
	}
	runtime := appruntime.Systemd{UnitRoot: env("CLOUD_CORE_UNIT_ROOT", "/etc/systemd/system"), SocketRoot: env("CLOUD_CORE_SOCKET_ROOT", "/run/usecloud/apps")}
	manager := &appmanager.Manager{Repository: db, Runtime: runtime, Bus: events.New(), Root: env("CLOUD_CORE_APP_ROOT", "/var/lib/usecloud/apps"), DataRoot: env("CLOUD_CORE_DATA_ROOT", "/var/lib/usecloud/data"), AllowUnsignedEmbedded: os.Getenv("CLOUD_CORE_ALLOW_UNSIGNED_EMBEDDED") == "1"}
	version := buildinfo.Current()
	address := os.Getenv("CLOUD_CORE_ADDR")
	if address == "" {
		address = defaultAddress
	}

	platformAPI := platform.HTTP{Manager: manager, Auth: authentication, Database: db, CatalogRoot: env("CLOUD_CORE_CATALOG_ROOT", "/var/lib/usecloud/catalog"), SocketRoot: runtime.SocketRoot}
	httpServer := server.New(address, platformAPI.Bind(api.New(systemService, logger, version).Handler()), logger)
	shutdownSignals, stopSignals := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stopSignals()

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("starting cloud-core", "version", version.Version, "commit", version.Commit, "build_time", version.BuildTime, "address", address)
		serverErrors <- httpServer.ListenAndServe()
	}()

	select {
	case err := <-serverErrors:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-shutdownSignals.Done():
		logger.Info("shutting down cloud-core", "signal", shutdownSignals.Err())
	}

	shutdownContext, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(shutdownContext); err != nil {
		return err
	}

	err = <-serverErrors
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	logger.Info("cloud-core stopped gracefully")
	return nil
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
