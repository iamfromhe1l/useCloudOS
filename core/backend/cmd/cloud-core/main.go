package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"net/url"
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
	slog.SetDefault(logger)
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
	authentication.Origin = os.Getenv("CLOUD_CORE_ORIGIN")
	if !authentication.Development && os.Getenv("CLOUD_CORE_DEV_HTTP") != "1" {
		origin, err := url.Parse(authentication.Origin)
		if err != nil || origin.Scheme != "https" || origin.Host == "" || origin.Path != "" || origin.User != nil || origin.RawQuery != "" || origin.Fragment != "" {
			return errors.New("production requires CLOUD_CORE_ORIGIN=https://canonical-host without a path")
		}
		if os.Getenv("CLOUD_CORE_ALLOW_UNSIGNED_EMBEDDED") == "1" {
			return errors.New("untrusted embedded/native code is a development-only policy")
		}
	}
	if err := authentication.Bootstrap(dbContext, os.Getenv("CLOUD_CORE_BOOTSTRAP_PASSWORD")); err != nil {
		return err
	}
	if !authentication.Development && !authentication.SecureCookie && os.Getenv("CLOUD_CORE_DEV_HTTP") != "1" {
		return errors.New("Secure session cookies required; HTTP exception requires explicit CLOUD_CORE_DEV_HTTP=1")
	}
	var users int
	if err := db.Pool.QueryRow(dbContext, "SELECT count(*) FROM users WHERE disabled_at IS NULL").Scan(&users); err != nil {
		return err
	}
	if users == 0 && !authentication.Development {
		return errors.New("no owner exists: set CLOUD_CORE_BOOTSTRAP_PASSWORD for first run")
	}
	runtime := appruntime.Systemd{UnitRoot: env("CLOUD_CORE_UNIT_ROOT", "/etc/systemd/system"), SocketRoot: env("CLOUD_CORE_SOCKET_ROOT", "/run/usecloud/apps"), SharedRoot: env("CLOUD_CORE_SHARED_ROOT", "/data/shared")}
	manager := &appmanager.Manager{Repository: db, Runtime: runtime, Bus: events.New(), Root: env("CLOUD_CORE_APP_ROOT", "/var/lib/usecloud/apps"), DataRoot: env("CLOUD_CORE_DATA_ROOT", "/var/lib/usecloud/data"), AllowUnsignedEmbedded: os.Getenv("CLOUD_CORE_ALLOW_UNSIGNED_EMBEDDED") == "1"}
	manager.ResolveTrust = db.ResolveTrust
	manager.KeyAllowed = db.KeyAllowed
	if err := validateRoots(manager.Root, manager.DataRoot, runtime.SharedRoot, runtime.SocketRoot, runtime.UnitRoot); err != nil {
		return err
	}
	installed, err := db.List(dbContext)
	if err != nil {
		return err
	}
	for _, app := range installed {
		executable := app.Manifest.Runtime.Type == "native" || app.Manifest.Frontend != nil && app.Manifest.Frontend.Type == "web-component"
		if !db.KeyAllowed(dbContext, app.PublisherKey) || !manager.AllowUnsignedEmbedded && executable && (app.Trust != "verified" || app.PublisherKey == "") {
			logger.Warn("stopping application excluded by trust policy", "app_id", app.Manifest.Metadata.ID)
			if err := runtime.Stop(dbContext, app); err != nil {
				logger.Error("application trust-policy stop failed", "app_id", app.Manifest.Metadata.ID)
			}
		}
	}
	version := buildinfo.Current()
	address := os.Getenv("CLOUD_CORE_ADDR")
	if address == "" {
		address = defaultAddress
	}

	platformAPI := platform.HTTP{Manager: manager, Auth: authentication, Database: db, CatalogRoot: env("CLOUD_CORE_CATALOG_ROOT", "/var/lib/usecloud/catalog"), SocketRoot: runtime.SocketRoot}
	httpServer := server.New(address, platformAPI.Bind(api.New(systemService, logger, version).Handler()), logger)
	shutdownSignals, stopSignals := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stopSignals()
	httpServer.BaseContext = func(net.Listener) context.Context { return shutdownSignals }

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
