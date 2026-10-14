package docker

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"io"
	"strings"
	"testing"
	"time"
)

type fakeProvider struct {
	info        EngineInfo
	containers  []ContainerRecord
	inspection  ContainerInspection
	stats       StatsSnapshot
	logData     []byte
	multiplexed bool
	logsOptions LogsOptions
	err         error
	operation   string
}

func (provider *fakeProvider) Info(context.Context) (EngineInfo, error) {
	return provider.info, provider.err
}

func (provider *fakeProvider) List(context.Context) ([]ContainerRecord, error) {
	return provider.containers, provider.err
}

func (provider *fakeProvider) Inspect(context.Context, string) (ContainerInspection, error) {
	return provider.inspection, provider.err
}

func (provider *fakeProvider) Start(context.Context, string) error {
	provider.operation = "start"
	return provider.err
}

func (provider *fakeProvider) Stop(context.Context, string) error {
	provider.operation = "stop"
	return provider.err
}

func (provider *fakeProvider) Restart(context.Context, string) error {
	provider.operation = "restart"
	return provider.err
}

func (provider *fakeProvider) Stats(context.Context, string) (StatsSnapshot, error) {
	return provider.stats, provider.err
}

func (provider *fakeProvider) Logs(_ context.Context, _ string, options LogsOptions) (LogStream, error) {
	provider.logsOptions = options
	if provider.err != nil {
		return LogStream{}, provider.err
	}
	return LogStream{Reader: io.NopCloser(bytes.NewReader(provider.logData)), Multiplexed: provider.multiplexed}, nil
}

func (provider *fakeProvider) Close() error { return nil }

func TestInfoReportsUnavailableWithoutFailing(t *testing.T) {
	service := NewService(&fakeProvider{err: ErrUnavailable})
	info, err := service.Info(context.Background())
	if err != nil {
		t.Fatalf("Info() error = %v", err)
	}
	if info.Available {
		t.Fatalf("Info() = %#v", info)
	}
}

func TestContainerDTOMappingAndStateNormalization(t *testing.T) {
	created := time.Date(2026, 10, 6, 12, 0, 0, 0, time.UTC)
	provider := &fakeProvider{containers: []ContainerRecord{{
		ID: "abc", Name: "jellyfin", Image: "jellyfin/jellyfin:latest",
		State: "RUNNING", Status: "Up 2 hours", CreatedAt: created,
	}}}
	containers, err := NewService(provider).Containers(context.Background())
	if err != nil {
		t.Fatalf("Containers() error = %v", err)
	}
	if len(containers) != 1 {
		t.Fatalf("containers = %#v", containers)
	}
	container := containers[0]
	if container.ID != "abc" || container.Name != "jellyfin" || container.State != "running" || container.CreatedAt != created {
		t.Fatalf("container = %#v", container)
	}
}

func TestNormalizeState(t *testing.T) {
	for input, expected := range map[string]string{
		"created": "created", "running": "running", "paused": "paused",
		"restarting": "restarting", "removing": "removing", "exited": "exited",
		"dead": "dead", "unexpected": "unknown", "": "unknown",
	} {
		if actual := normalizeState(input); actual != expected {
			t.Errorf("normalizeState(%q) = %q, want %q", input, actual, expected)
		}
	}
}

func TestContainerStatsCalculations(t *testing.T) {
	provider := &fakeProvider{stats: StatsSnapshot{
		CPU: CPUCounters{
			Usage: 1500, PreviousUsage: 1000,
			System: 10000, PreviousSystem: 9000, OnlineCPUs: 4,
		},
		Memory: MemoryCounters{
			Usage: 1000, Limit: 2000, Stats: map[string]uint64{"inactive_file": 200},
		},
		Networks: map[string]NetworkCounters{
			"eth0": {RXBytes: 100, TXBytes: 200},
			"eth1": {RXBytes: 30, TXBytes: 40},
		},
		BlockIO: []BlockIOEntry{
			{Operation: "Read", Value: 100}, {Operation: "read", Value: 20},
			{Operation: "Write", Value: 70}, {Operation: "Sync", Value: 999},
		},
	}}
	stats, err := NewService(provider).Stats(context.Background(), "abc")
	if err != nil {
		t.Fatalf("Stats() error = %v", err)
	}
	if stats.CPUPercent != 200 {
		t.Errorf("CPUPercent = %v, want 200", stats.CPUPercent)
	}
	if stats.Memory.UsedBytes != 800 || stats.Memory.UsagePercent != 40 {
		t.Errorf("Memory = %#v", stats.Memory)
	}
	if stats.Network.RXBytes != 130 || stats.Network.TXBytes != 240 {
		t.Errorf("Network = %#v", stats.Network)
	}
	if stats.BlockIO.ReadBytes != 120 || stats.BlockIO.WriteBytes != 70 {
		t.Errorf("BlockIO = %#v", stats.BlockIO)
	}
}

func TestCPUPercentFallsBackToPerCPU(t *testing.T) {
	percent := cpuPercent(CPUCounters{
		Usage: 300, PreviousUsage: 200, System: 2000, PreviousSystem: 1000,
		PerCPU: []uint64{1, 1},
	})
	if percent != 20 {
		t.Fatalf("cpuPercent() = %v, want 20", percent)
	}
}

func TestLogsDefaultsAndLimit(t *testing.T) {
	provider := &fakeProvider{logData: []byte(strings.Repeat("x", maximumLogBytes+100))}
	logs, err := NewService(provider).Logs(context.Background(), "abc", "", "")
	if err != nil {
		t.Fatalf("Logs() error = %v", err)
	}
	if provider.logsOptions.Tail != defaultLogTail {
		t.Fatalf("Tail = %d", provider.logsOptions.Tail)
	}
	if !logs.Truncated || len(logs.Logs) != maximumLogBytes {
		t.Fatalf("Logs() length = %d, truncated = %v", len(logs.Logs), logs.Truncated)
	}
}

func TestLogsDemultiplexesDockerStream(t *testing.T) {
	data := append(multiplexFrame(1, "stdout\n"), multiplexFrame(2, "stderr\n")...)
	provider := &fakeProvider{logData: data, multiplexed: true}
	logs, err := NewService(provider).Logs(context.Background(), "abc", "20", "10m")
	if err != nil {
		t.Fatalf("Logs() error = %v", err)
	}
	if logs.Logs != "stdout\nstderr\n" || logs.Truncated {
		t.Fatalf("Logs() = %#v", logs)
	}
	if provider.logsOptions.Tail != 20 || provider.logsOptions.Since != "10m" {
		t.Fatalf("options = %#v", provider.logsOptions)
	}
}

func TestLogsRejectsUnsafeLimits(t *testing.T) {
	service := NewService(&fakeProvider{})
	for _, tail := range []string{"0", "1001", "all", "invalid"} {
		if _, err := service.Logs(context.Background(), "abc", tail, ""); !errors.Is(err, ErrInvalidArgument) {
			t.Errorf("tail %q error = %v", tail, err)
		}
	}
	if _, err := service.Logs(context.Background(), "abc", "10", "not-a-time"); !errors.Is(err, ErrInvalidArgument) {
		t.Errorf("invalid since error = %v", err)
	}
}

func multiplexFrame(stream byte, payload string) []byte {
	frame := make([]byte, 8+len(payload))
	frame[0] = stream
	binary.BigEndian.PutUint32(frame[4:8], uint32(len(payload)))
	copy(frame[8:], payload)
	return frame
}
