package appmanager

import (
	"context"
	"errors"
	"go.yaml.in/yaml/v3"
	"os"
	"path/filepath"
	"testing"
	"usecloudos/backend/internal/apppackage"
	"usecloudos/backend/internal/events"
	"usecloudos/backend/internal/registry"
	"usecloudos/backend/internal/registrytest"
)

type fakeRuntime struct {
	fail        bool
	failVersion string
	running     bool
}

func (f *fakeRuntime) Start(_ context.Context, app registry.Application) error {
	if f.fail || app.Manifest.Metadata.Version == f.failVersion {
		return errors.New("crash")
	}
	f.running = true
	return nil
}
func (f *fakeRuntime) Stop(context.Context, registry.Application) error {
	f.running = false
	return nil
}
func (f *fakeRuntime) Remove(context.Context, registry.Application) error { return nil }
func (f *fakeRuntime) Status(context.Context, registry.Application) string {
	if f.running {
		return "running"
	}
	return "stopped"
}
func testPackage(t *testing.T) *apppackage.Package {
	t.Helper()
	dir := t.TempDir()
	raw, _ := yaml.Marshal(registrytest.Manifest())
	_ = os.WriteFile(filepath.Join(dir, "manifest.yaml"), raw, 0644)
	_ = os.Mkdir(filepath.Join(dir, "backend"), 0755)
	_ = os.WriteFile(filepath.Join(dir, "backend/service"), []byte("test"), 0755)
	data, err := apppackage.Pack(dir)
	if err != nil {
		t.Fatal(err)
	}
	p, err := apppackage.Inspect(data)
	if err != nil {
		t.Fatal(err)
	}
	return p
}
func TestInstallUninstallDataAndTrust(t *testing.T) {
	ctx := context.Background()
	repository := registrytest.New()
	runtime := &fakeRuntime{}
	m := &Manager{Repository: repository, Runtime: runtime, Bus: events.New(), Root: filepath.Join(t.TempDir(), "apps"), DataRoot: t.TempDir()}
	p := testPackage(t)
	if _, err := m.Install(ctx, p, false); err == nil {
		t.Fatal("no consent")
	}
	if _, err := m.Install(ctx, p, true); err == nil {
		t.Fatal("unsigned embedded accepted")
	}
	m.AllowUnsignedEmbedded = true
	app, err := m.Install(ctx, p, true)
	if err != nil || app.Status != "running" {
		t.Fatalf("install %v", err)
	}
	if _, err = m.Install(ctx, p, true); err == nil {
		t.Fatal("duplicate accepted")
	}
	_ = os.WriteFile(filepath.Join(app.DataPath, "keep"), []byte("data"), 0644)
	if err = m.Uninstall(ctx, "../oops", false); err == nil {
		t.Fatal("unsafe id")
	}
	if err = m.Uninstall(ctx, "example", false); err != nil {
		t.Fatal(err)
	}
	if _, err = os.Stat(filepath.Join(app.DataPath, "keep")); err != nil {
		t.Fatal("data removed")
	}
	if _, err = repository.Get(ctx, "example"); !errors.Is(err, registry.ErrNotFound) {
		t.Fatal("registry not removed")
	}
	if _, err = m.Install(ctx, p, true); err != nil {
		t.Fatal(err)
	}
	if err = m.Uninstall(ctx, "example", true); err != nil {
		t.Fatal(err)
	}
	if _, err = os.Stat(app.DataPath); !os.IsNotExist(err) {
		t.Fatal("purge did not remove data")
	}
}
func TestCrashIsIsolated(t *testing.T) {
	m := &Manager{Repository: registrytest.New(), Runtime: &fakeRuntime{fail: true}, Bus: events.New(), Root: t.TempDir(), DataRoot: t.TempDir(), AllowUnsignedEmbedded: true}
	a, err := m.Install(context.Background(), testPackage(t), true)
	if err != nil || a.Status != "failed" {
		t.Fatalf("crash isolation: %s %v", a.Status, err)
	}
}

func TestUpdateRollbackAndRetry(t *testing.T) {
	ctx := context.Background()
	repo := registrytest.New()
	runtime := &fakeRuntime{}
	manager := &Manager{Repository: repo, Runtime: runtime, Bus: events.New(), Root: t.TempDir(), DataRoot: t.TempDir(), AllowUnsignedEmbedded: true}
	pkg := testPackage(t)
	if _, err := manager.Install(ctx, pkg, true); err != nil {
		t.Fatal(err)
	}
	pkg.Manifest.Metadata.Version = "0.2.0"
	runtime.failVersion = "0.2.0"
	if err := manager.Update(ctx, pkg, true); err == nil {
		t.Fatal("bad update succeeded")
	}
	previous, err := repo.Get(ctx, "example")
	if err != nil || previous.Manifest.Metadata.Version != "0.1.0" || previous.Status != "running" {
		t.Fatal("old version was not restored")
	}
	runtime.failVersion = ""
	if err := manager.Update(ctx, pkg, true); err != nil {
		t.Fatal(err)
	}
	current, _ := repo.Get(ctx, "example")
	if current.Manifest.Metadata.Version != "0.2.0" {
		t.Fatal("new version not saved")
	}
}
