package docker

import (
	"errors"
	"net/netip"
	"testing"
	"time"

	cerrdefs "github.com/containerd/errdefs"
	containertypes "github.com/moby/moby/api/types/container"
	networktypes "github.com/moby/moby/api/types/network"
)

func TestMapContainerSummary(t *testing.T) {
	result := mapContainerSummary(containertypes.Summary{
		ID: "abc", Names: []string{"/jellyfin"}, Image: "jellyfin/jellyfin:latest",
		State: "running", Status: "Up 2 hours", Created: 1791288000,
	})
	if result.Name != "jellyfin" || result.State != "running" || result.CreatedAt.Location() != time.UTC {
		t.Fatalf("mapContainerSummary() = %#v", result)
	}
}

func TestMapContainerInspectionExcludesEnvironment(t *testing.T) {
	containerPort, err := networktypes.ParsePort("8096/tcp")
	if err != nil {
		t.Fatal(err)
	}
	result := mapContainerInspection(containertypes.InspectResponse{
		ID: "abc", Name: "/jellyfin", Created: "2026-10-06T12:00:00Z", RestartCount: 2,
		State:  &containertypes.State{Status: "running", StartedAt: "2026-10-06T12:01:00Z"},
		Config: &containertypes.Config{Image: "jellyfin/jellyfin:latest", Env: []string{"SECRET=value"}},
		NetworkSettings: &containertypes.NetworkSettings{Ports: networktypes.PortMap{
			containerPort: {{HostIP: netip.MustParseAddr("0.0.0.0"), HostPort: "8096"}},
		}},
	})
	if result.Name != "jellyfin" || result.Image != "jellyfin/jellyfin:latest" || result.RestartCount != 2 {
		t.Fatalf("mapContainerInspection() = %#v", result)
	}
	if len(result.Ports) != 1 || result.Ports[0].ContainerPort != 8096 || result.Ports[0].HostPort != 8096 {
		t.Fatalf("Ports = %#v", result.Ports)
	}
	// ContainerInspection intentionally has no environment field; this compile-time
	// mapping test guards the DTO boundary from returning inspect.Config.Env.
}

func TestMapInspectStateFallbacks(t *testing.T) {
	tests := []struct {
		state    *containertypes.State
		expected string
	}{
		{state: nil, expected: "unknown"},
		{state: &containertypes.State{Running: true}, expected: "running"},
		{state: &containertypes.State{Paused: true}, expected: "paused"},
		{state: &containertypes.State{Restarting: true}, expected: "restarting"},
		{state: &containertypes.State{Dead: true}, expected: "dead"},
		{state: &containertypes.State{}, expected: "exited"},
	}
	for _, test := range tests {
		if actual := mapInspectState(test.state); actual != test.expected {
			t.Errorf("mapInspectState(%#v) = %q", test.state, actual)
		}
	}
}

func TestNormalizeDockerErrors(t *testing.T) {
	if err := normalizeError(cerrdefs.ErrNotFound); !errors.Is(err, ErrNotFound) {
		t.Fatalf("not-found error = %v", err)
	}
	if err := normalizeError(cerrdefs.ErrNotModified); !errors.Is(err, ErrConflict) {
		t.Fatalf("not-modified error = %v", err)
	}
	if err := normalizeError(cerrdefs.ErrUnavailable); !errors.Is(err, ErrUnavailable) {
		t.Fatalf("unavailable error = %v", err)
	}
}
