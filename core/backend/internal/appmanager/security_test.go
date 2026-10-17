package appmanager

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"go.yaml.in/yaml/v3"
	"os"
	"path/filepath"
	"testing"
	"usecloudos/backend/internal/apppackage"
	"usecloudos/backend/internal/events"
	"usecloudos/backend/internal/registrytest"
)

func signedVersion(t *testing.T, key ed25519.PrivateKey, version string) *apppackage.Package {
	t.Helper()
	directory := t.TempDir()
	m := registrytest.Manifest()
	m.Metadata.Version = version
	raw, _ := yaml.Marshal(m)
	_ = os.WriteFile(filepath.Join(directory, "manifest.yaml"), raw, 0600)
	_ = os.Mkdir(filepath.Join(directory, "backend"), 0700)
	_ = os.WriteFile(filepath.Join(directory, "backend/service"), []byte("test-only native fixture"), 0700)
	data, err := apppackage.Pack(directory)
	if err != nil {
		t.Fatal(err)
	}
	data, err = apppackage.Sign(data, key, "fixture", "Fixture publisher")
	if err != nil {
		t.Fatal(err)
	}
	p, err := apppackage.Inspect(data)
	if err != nil {
		t.Fatal(err)
	}
	return p
}
func TestSignedUpdateRollback(t *testing.T) {
	_, key, _ := ed25519.GenerateKey(rand.Reader)
	ctx := context.Background()
	repo := registrytest.New()
	runtime := &fakeRuntime{failVersion: "0.2.0"}
	m := &Manager{Repository: repo, Runtime: runtime, Bus: events.New(), Root: filepath.Join(t.TempDir(), "apps"), DataRoot: t.TempDir(), ResolveTrust: func(ctx context.Context, p *apppackage.Package) error { p.Trust = "verified"; return nil }}
	if _, err := m.Install(ctx, signedVersion(t, key, "0.1.0"), true); err != nil {
		t.Fatal(err)
	}
	if m.Update(ctx, signedVersion(t, key, "0.2.0"), true) == nil {
		t.Fatal("failed update accepted")
	}
	a, err := repo.Get(ctx, "example")
	if err != nil || a.Manifest.Metadata.Version != "0.1.0" || a.Status != "running" || a.Trust != "verified" {
		t.Fatalf("signed rollback failed: %+v %v", a, err)
	}
}

func TestRevocationSurvivesUpdateAndTrustDowngrade(t *testing.T) {
	ctx := context.Background()
	repo := registrytest.New()
	m := &Manager{Repository: repo, Runtime: &fakeRuntime{}, Bus: events.New(), Root: filepath.Join(t.TempDir(), "apps"), DataRoot: t.TempDir(), AllowUnsignedEmbedded: true}
	p := testPackage(t)
	a, err := m.Install(ctx, p, true)
	if err != nil {
		t.Fatal(err)
	}
	if err = m.SetPermission(ctx, a.Manifest.Metadata.ID, "docker.manage", false); err != nil {
		t.Fatal(err)
	}
	p.Manifest.Metadata.Version = "0.2.0"
	if err = m.Update(ctx, p, true); err != nil {
		t.Fatal(err)
	}
	a, _ = repo.Get(ctx, a.Manifest.Metadata.ID)
	if a.Has("docker.manage") {
		t.Fatal("update silently restored revoked capability")
	}
	a.Trust = "verified"
	a.PublisherKey = "existing-trusted-key"
	_ = repo.Save(ctx, a)
	p.Manifest.Metadata.Version = "0.3.0"
	if m.Update(ctx, p, true) == nil {
		t.Fatal("unsigned downgrade accepted")
	}
}
