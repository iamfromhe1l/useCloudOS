package manifest_test

import (
	"go.yaml.in/yaml/v3"
	"testing"
	"usecloudos/backend/internal/manifest"
	"usecloudos/backend/internal/registrytest"
)

func TestParseAndValidation(t *testing.T) {
	m := registrytest.Manifest()
	raw, _ := yaml.Marshal(m)
	if _, err := manifest.Parse(raw); err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"../escape", "settings", "UPPER", "a/b", "a..b", ""} {
		copy := m
		copy.Metadata.ID = id
		if copy.Validate() == nil {
			t.Fatalf("accepted id %q", id)
		}
	}
	copy := m
	copy.Metadata.Version = "latest"
	if copy.Validate() == nil {
		t.Fatal("accepted non-semver")
	}
	copy = m
	copy.Platform.MinVersion = "99.0.0"
	if copy.Validate() == nil {
		t.Fatal("accepted incompatible platform")
	}
	if _, err := manifest.Parse(append(raw, []byte("unknown: true\n")...)); err == nil {
		t.Fatal("accepted unknown fields")
	}
}
func TestPermissionRouting(t *testing.T) {
	m := registrytest.Manifest()
	p, ok := m.RequiredPermission("GET", "/items")
	if !ok || p != "system.read" {
		t.Fatal("read permission")
	}
	p, ok = m.RequiredPermission("POST", "/items/1")
	if !ok || p != "docker.manage" {
		t.Fatal("manage permission")
	}
	if _, ok = m.RequiredPermission("DELETE", "/items"); ok {
		t.Fatal("undeclared route allowed")
	}
}
func TestPaths(t *testing.T) {
	for _, p := range []string{"../x", "/x", "x/../y", "x\\y", "a%20b", "x\nExecStart=bad", "C:x"} {
		if manifest.SafePath(p) {
			t.Fatalf("accepted %q", p)
		}
	}
}

func TestOCICommandValidation(t *testing.T) {
	m := registrytest.Manifest()
	m.Backend = nil
	m.Runtime = manifest.Runtime{Type: "container", Image: "alpine:3.22", InternalPort: 8080, Command: []string{"sleep", "3600"}}
	if err := m.Validate(); err != nil {
		t.Fatal(err)
	}
	m.Runtime.Command = []string{"bad\x00argument"}
	if m.Validate() == nil {
		t.Fatal("accepted NUL in command")
	}
	m.Runtime = manifest.Runtime{Type: "native", Command: []string{"sh"}}
	if m.Validate() == nil {
		t.Fatal("accepted container command for native runtime")
	}
}
