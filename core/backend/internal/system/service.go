package system

import (
	"context"
	"errors"
	"fmt"
	"math"
	"runtime"
	"time"
)

const defaultCPUSampleInterval = 250 * time.Millisecond

type Service struct {
	provider       Provider
	sampleInterval time.Duration
}

func NewService(provider Provider) *Service {
	return &Service{provider: provider, sampleInterval: defaultCPUSampleInterval}
}

// NewServiceWithInterval is useful for deterministic tests and specialized
// callers. Production code should normally use NewService.
func NewServiceWithInterval(provider Provider, interval time.Duration) *Service {
	return &Service{provider: provider, sampleInterval: interval}
}

func (s *Service) Info(ctx context.Context) (Info, error) {
	return s.provider.SystemInfo(ctx)
}

func (s *Service) Resources(ctx context.Context) (Resources, error) {
	first, err := s.provider.CPUStats(ctx)
	if err != nil {
		return Resources{}, fmt.Errorf("read initial CPU counters: %w", err)
	}

	if err := wait(ctx, s.sampleInterval); err != nil {
		return Resources{}, err
	}

	second, err := s.provider.CPUStats(ctx)
	if err != nil {
		return Resources{}, fmt.Errorf("read final CPU counters: %w", err)
	}

	usage, err := cpuUsagePercent(first, second)
	if err != nil {
		return Resources{}, err
	}

	memory, err := s.provider.MemoryInfo(ctx)
	if err != nil {
		return Resources{}, fmt.Errorf("read memory information: %w", err)
	}

	return Resources{
		CPU: CPU{
			LogicalCores: logicalCores(),
			UsagePercent: roundPercent(usage),
		},
		Memory: memory,
	}, nil
}

func (s *Service) Filesystems(ctx context.Context) ([]Filesystem, error) {
	return s.provider.Filesystems(ctx)
}

func cpuUsagePercent(first, second CPUStats) (float64, error) {
	if second.Total < first.Total || second.Idle < first.Idle {
		return 0, errors.New("CPU counters moved backwards")
	}

	totalDelta := second.Total - first.Total
	idleDelta := second.Idle - first.Idle
	if totalDelta == 0 || idleDelta > totalDelta {
		return 0, errors.New("invalid CPU counter delta")
	}

	return float64(totalDelta-idleDelta) / float64(totalDelta) * 100, nil
}

func wait(ctx context.Context, interval time.Duration) error {
	if interval <= 0 {
		return nil
	}
	timer := time.NewTimer(interval)
	defer timer.Stop()
	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func roundPercent(value float64) float64 {
	return math.Round(value*10) / 10
}

func logicalCores() int {
	return runtime.NumCPU()
}
