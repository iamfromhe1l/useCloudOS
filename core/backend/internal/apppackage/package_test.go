package apppackage

import (
	"archive/zip"
	"bytes"
	"go.yaml.in/yaml/v3"
	"os"
	"path/filepath"
	"testing"
	"usecloudos/backend/internal/registrytest"
)

func archive(t *testing.T, extra string, mode os.FileMode) []byte {
	t.Helper()
	var b bytes.Buffer
	w := zip.NewWriter(&b)
	m, _ := yaml.Marshal(registrytest.Manifest())
	for name, data := range map[string][]byte{"manifest.yaml": m, "backend/service": []byte("binary")} {
		f, _ := w.Create(name)
		_, _ = f.Write(data)
	}
	if extra != "" {
		h := &zip.FileHeader{Name: extra}
		h.SetMode(mode)
		f, _ := w.CreateHeader(h)
		_, _ = f.Write([]byte("payload"))
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}
func TestRejectUnsafeArchives(t *testing.T) {
	for _, name := range []string{"../escape", "/absolute", "backend/../escape", "backend/service", "C:/windows", "signature/fake"} {
		if _, err := Inspect(archive(t, name, 0644)); err == nil {
			t.Fatalf("accepted %q", name)
		}
	}
	if _, err := Inspect(archive(t, "frontend/link", os.ModeSymlink|0777)); err == nil {
		t.Fatal("accepted symlink")
	}
}
func TestExtractAndReproduciblePack(t *testing.T) {
	p, err := Inspect(archive(t, "", 0644))
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	if err = p.Extract(dir); err != nil {
		t.Fatal(err)
	}
	if _, err = os.Stat(filepath.Join(dir, "backend/service")); err != nil {
		t.Fatal(err)
	}
	a, err := Pack(dir)
	if err != nil {
		t.Fatal(err)
	}
	b, err := Pack(dir)
	if err != nil || !bytes.Equal(a, b) {
		t.Fatal("non-reproducible package")
	}
	if err = p.Extract(dir); err == nil {
		t.Fatal("overwrote existing files")
	}
}
