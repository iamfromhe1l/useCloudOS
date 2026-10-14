package system

import (
	"context"
	"errors"
	"testing"
)

type fakeProvider struct {
	info        Info
	cpu         []CPUStats
	cpuCalls    int
	memory      Memory
	filesystems []Filesystem
	err         error
}

func (provider *fakeProvider) SystemInfo(context.Context) (Info, error) {
	return provider.info, provider.err
}

func (provider *fakeProvider) CPUStats(context.Context) (CPUStats, error) {
	if provider.err != nil {
		return CPUStats{}, provider.err
	}
	value := provider.cpu[provider.cpuCalls]
	provider.cpuCalls++
	return value, nil
}

func (provider *fakeProvider) MemoryInfo(context.Context) (Memory, error) {
	return provider.memory, provider.err
}

func (provider *fakeProvider) Filesystems(context.Context) ([]Filesystem, error) {
	return provider.filesystems, provider.err
}

func TestServiceResources(t *testing.T) {
	provider := &fakeProvider{
		cpu: []CPUStats{
			{Total: 1000, Idle: 700},
			{Total: 1200, Idle: 800},
		},
		memory: Memory{TotalBytes: 100, AvailableBytes: 40, UsedBytes: 60, UsagePercent: 60},
	}
	service := NewServiceWithInterval(provider, 0)

	resources, err := service.Resources(context.Background())
	if err != nil {
		t.Fatalf("Resources() error = %v", err)
	}
	if resources.CPU.UsagePercent != 50 || resources.CPU.LogicalCores < 1 {
		t.Fatalf("CPU = %#v", resources.CPU)
	}
	if resources.Memory != provider.memory {
		t.Fatalf("Memory = %#v", resources.Memory)
	}
}

func TestServicePropagatesProviderError(t *testing.T) {
	service := NewServiceWithInterval(&fakeProvider{err: errors.New("read failed")}, 0)
	if _, err := service.Resources(context.Background()); err == nil {
		t.Fatal("Resources() expected an error")
	}
}
