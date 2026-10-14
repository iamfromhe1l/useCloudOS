package appmanager

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"usecloudos/backend/internal/apppackage"
	"usecloudos/backend/internal/events"
	"usecloudos/backend/internal/manifest"
	"usecloudos/backend/internal/registry"
)

type Runtime interface {
	Start(context.Context, registry.Application) error
	Stop(context.Context, registry.Application) error
	Status(context.Context, registry.Application) string
	Remove(context.Context, registry.Application) error
}
type Manager struct {
	Repository            registry.Repository
	Runtime               Runtime
	Bus                   *events.Bus
	Root, DataRoot        string
	AllowUnsignedEmbedded bool
	mu                    sync.Mutex
}

func (m *Manager) emit(ctx context.Context, id, event string) {
	_ = m.Repository.Event(ctx, id, event, "")
	m.Bus.Publish(events.Event{Type: event, AppID: id})
}
func (m *Manager) Install(ctx context.Context, p *apppackage.Package, consent bool) (registry.Application, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var empty registry.Application
	if !consent {
		return empty, errors.New("explicit permission/trust confirmation required")
	}
	if p.Trust == "unsigned" && (p.Manifest.Runtime.Type == "native" || p.Manifest.Frontend != nil && p.Manifest.Frontend.Type == "web-component") && !m.AllowUnsignedEmbedded {
		return empty, errors.New("unsigned executable/embedded applications are disabled; use an explicit development trust policy")
	}
	id := p.Manifest.Metadata.ID
	apps, err := m.Repository.List(ctx)
	if err != nil { return empty, err }
	if p.Manifest.Frontend != nil && p.Manifest.Frontend.Type == "web-component" {
		for _, existing := range apps { if existing.Manifest.Frontend != nil && existing.Manifest.Frontend.Element == p.Manifest.Frontend.Element { return empty, errors.New("custom element is already owned by another application") } }
	}
	if _, err := m.Repository.Get(ctx, id); err == nil {
		return empty, errors.New("application already installed; use update")
	} else if !errors.Is(err, registry.ErrNotFound) {
		return empty, err
	}
	if err := os.MkdirAll(m.Root, 0750); err != nil {
		return empty, err
	}
	// Other app users may traverse the root, but cannot list it or enter peers'
	// private 0750 directories. They do not belong to a shared writable group.
	if err := os.Chmod(m.Root, 0751); err != nil { return empty, err }
	if err := os.MkdirAll(m.DataRoot, 0751); err != nil { return empty, err }
	if err := os.Chmod(m.DataRoot, 0751); err != nil { return empty, err }
	stage, err := os.MkdirTemp(m.Root, ".install-")
	if err != nil {
		return empty, err
	}
	defer os.RemoveAll(stage)
	if err = p.Extract(stage); err != nil {
		return empty, err
	}
	destination := filepath.Join(m.Root, id)
	if _, err = os.Lstat(destination); !os.IsNotExist(err) {
		return empty, errors.New("installation path already exists")
	}
	if err = os.Mkdir(destination, 0750); err != nil {
		return empty, err
	}
	versionPath := filepath.Join(destination, p.Manifest.Metadata.Version)
	if err = os.Rename(stage, versionPath); err != nil {
		os.Remove(destination)
		return empty, err
	}
	if err = os.Symlink(p.Manifest.Metadata.Version, filepath.Join(destination, "current")); err != nil {
		os.RemoveAll(destination)
		return empty, err
	}
	dataPath := filepath.Join(m.DataRoot, id)
	if err = os.MkdirAll(dataPath, 0750); err != nil {
		os.RemoveAll(destination)
		return empty, err
	}
	now := time.Now().UTC()
	app := registry.Application{Manifest: p.Manifest, Status: "installed", Trust: p.Trust, Digest: p.Digest, InstallPath: versionPath, DataPath: dataPath, InstalledAt: now, UpdatedAt: now, Grants: append([]string{}, p.Manifest.Permissions...)}
	if err = m.Repository.Save(ctx, app); err != nil {
		os.RemoveAll(destination)
		return empty, err
	}
	m.emit(ctx, id, "app.installed")
	if err = m.Runtime.Start(ctx, app); err != nil {
		app.Status = "failed"
		app.LastError = "Application service failed to start"
		_ = m.Repository.Save(ctx, app)
		m.emit(ctx, id, "app.failed")
		return app, nil
	}
	app.Status = m.Runtime.Status(ctx, app)
	if err = m.Repository.Save(ctx, app); err != nil {
		return app, err
	}
	m.emit(ctx, id, "app.started")
	return app, nil
}
func (m *Manager) Action(ctx context.Context, id, action string) error {
	if !manifest.ValidID(id) {
		return errors.New("invalid app id")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	app, err := m.Repository.Get(ctx, id)
	if err != nil {
		return err
	}
	switch action {
	case "start":
		err = m.Runtime.Start(ctx, app)
	case "stop":
		err = m.Runtime.Stop(ctx, app)
	case "restart":
		if err = m.Runtime.Stop(ctx, app); err == nil {
			err = m.Runtime.Start(ctx, app)
		}
	default:
		return errors.New("unknown application action")
	}
	app.UpdatedAt = time.Now().UTC()
	app.Status = m.Runtime.Status(ctx, app)
	app.LastError = ""
	if err != nil {
		app.Status = "failed"
		app.LastError = "Application lifecycle operation failed"
		m.emit(ctx, id, "app.failed")
	} else {
		event := "app.started"
		if action == "stop" {
			event = "app.stopped"
		}
		m.emit(ctx, id, event)
	}
	if saveErr := m.Repository.Save(ctx, app); saveErr != nil {
		return saveErr
	}
	return err
}
func (m *Manager) Uninstall(ctx context.Context, id string, purge bool) error {
	if !manifest.ValidID(id) {
		return errors.New("invalid app id")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	app, err := m.Repository.Get(ctx, id)
	if err != nil {
		return err
	}
	if err = m.Runtime.Stop(ctx, app); err != nil {
		return err
	}
	if err = m.Runtime.Remove(ctx, app); err != nil {
		return err
	}
	// Resolve targets exclusively from validated ID and configured roots.
	target := filepath.Join(m.Root, id)
	tombstone, err := os.MkdirTemp(m.Root, ".uninstall-")
	if err != nil {
		return err
	}
	os.Remove(tombstone)
	if err = os.Rename(target, tombstone); err != nil {
		return err
	}
	if err = m.Repository.Delete(ctx, id); err != nil {
		os.Rename(tombstone, target)
		return err
	}
	if err = os.RemoveAll(tombstone); err != nil {
		return err
	}
	if purge {
		if err = os.RemoveAll(filepath.Join(m.DataRoot, id)); err != nil {
			return err
		}
	}
	m.emit(ctx, id, "app.uninstalled")
	return nil
}

// Update staging and rollback are explicit; existing data is never replaced.
func (m *Manager) Update(ctx context.Context, p *apppackage.Package, consent bool) error {
	if !consent {
		return errors.New("update permission confirmation required")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	old, err := m.Repository.Get(ctx, p.Manifest.Metadata.ID)
	if err != nil {
		return err
	}
	if p.Trust == "unsigned" && !m.AllowUnsignedEmbedded {
		return errors.New("unsigned update disabled")
	}
	if old.Manifest.Metadata.Version == p.Manifest.Metadata.Version {
		return errors.New("version already installed")
	}
	if old.Manifest.Frontend != nil && p.Manifest.Frontend != nil && p.Manifest.Frontend.Type == "web-component" && old.Manifest.Frontend.Element == p.Manifest.Frontend.Element { return errors.New("frontend release requires a new version-qualified Custom Element name") }
	stage, err := os.MkdirTemp(m.Root, ".update-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(stage)
	if err = p.Extract(stage); err != nil {
		return err
	}
	root := filepath.Join(m.Root, p.Manifest.Metadata.ID)
	next := filepath.Join(root, p.Manifest.Metadata.Version)
	if _, err = os.Lstat(next); !os.IsNotExist(err) {
		return errors.New("version path already exists")
	}
	if err = m.Runtime.Stop(ctx, old); err != nil {
		return err
	}
	if err = os.Rename(stage, next); err != nil {
		_ = m.Runtime.Start(ctx, old)
		return err
	}
	app := old
	app.Manifest = p.Manifest
	app.InstallPath = next
	app.Digest = p.Digest
	app.Trust = p.Trust
	app.Grants = append([]string{}, p.Manifest.Permissions...)
	app.UpdatedAt = time.Now().UTC()
	rollback := func(cause error) error {
		_ = m.Runtime.Stop(ctx, app)
		_ = m.Runtime.Start(ctx, old)
		_ = m.Repository.Save(ctx, old)
		return fmt.Errorf("update rolled back: %w", cause)
	}
	if err = m.Runtime.Start(ctx, app); err != nil {
		return rollback(err)
	}
	app.Status = m.Runtime.Status(ctx, app)
	if app.Status != "running" && app.Manifest.Backend != nil {
		return rollback(errors.New("health check failed"))
	}
	if err = m.Repository.Save(ctx, app); err != nil {
		return rollback(err)
	}
	temporary := filepath.Join(root, ".current-next")
	_ = os.Remove(temporary)
	if err = os.Symlink(p.Manifest.Metadata.Version, temporary); err != nil {
		return rollback(err)
	}
	if err = os.Rename(temporary, filepath.Join(root, "current")); err != nil {
		return rollback(err)
	}
	m.emit(ctx, app.Manifest.Metadata.ID, "app.updated")
	return nil
}
