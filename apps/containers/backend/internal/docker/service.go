package docker

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/moby/moby/api/pkg/stdcopy"
)

const (
	defaultLogTail  = 200
	maximumLogTail  = 1000
	maximumLogBytes = 1 << 20
)

var errLogLimitReached = errors.New("log response limit reached")

type Service struct {
	provider Provider
}

func NewService(provider Provider) *Service {
	return &Service{provider: provider}
}

func (s *Service) Info(ctx context.Context) (Info, error) {
	info, err := s.provider.Info(ctx)
	if errors.Is(err, ErrUnavailable) {
		return Info{Available: false}, nil
	}
	if err != nil {
		return Info{}, err
	}
	return Info{
		Available:         true,
		ServerVersion:     info.ServerVersion,
		APIVersion:        info.APIVersion,
		Containers:        info.Containers,
		ContainersRunning: info.ContainersRunning,
		ContainersStopped: info.ContainersStopped,
		Images:            info.Images,
	}, nil
}

func (s *Service) Containers(ctx context.Context) ([]Container, error) {
	records, err := s.provider.List(ctx)
	if err != nil {
		return nil, err
	}
	containers := make([]Container, 0, len(records))
	for _, record := range records {
		containers = append(containers, Container{
			ID:        record.ID,
			Name:      record.Name,
			Image:     record.Image,
			State:     normalizeState(record.State),
			Status:    record.Status,
			CreatedAt: record.CreatedAt,
		})
	}
	return containers, nil
}

func (s *Service) Container(ctx context.Context, id string) (ContainerDetails, error) {
	inspection, err := s.provider.Inspect(ctx, id)
	if err != nil {
		return ContainerDetails{}, err
	}
	ports := inspection.Ports
	if ports == nil {
		ports = []Port{}
	}
	return ContainerDetails{
		ID:           inspection.ID,
		Name:         inspection.Name,
		Image:        inspection.Image,
		State:        normalizeState(inspection.State),
		CreatedAt:    inspection.CreatedAt,
		StartedAt:    inspection.StartedAt,
		RestartCount: inspection.RestartCount,
		Ports:        ports,
	}, nil
}

func (s *Service) Start(ctx context.Context, id string) error {
	return s.provider.Start(ctx, id)
}

func (s *Service) Stop(ctx context.Context, id string) error {
	return s.provider.Stop(ctx, id)
}

func (s *Service) Restart(ctx context.Context, id string) error {
	return s.provider.Restart(ctx, id)
}

func (s *Service) Stats(ctx context.Context, id string) (ContainerStats, error) {
	snapshot, err := s.provider.Stats(ctx, id)
	if err != nil {
		return ContainerStats{}, err
	}
	usedMemory := memoryUsage(snapshot.Memory)
	memoryPercent := float64(0)
	if snapshot.Memory.Limit > 0 {
		memoryPercent = float64(usedMemory) / float64(snapshot.Memory.Limit) * 100
	}
	return ContainerStats{
		CPUPercent: roundPercent(cpuPercent(snapshot.CPU)),
		Memory: MemoryStats{
			UsedBytes:    usedMemory,
			LimitBytes:   snapshot.Memory.Limit,
			UsagePercent: roundPercent(memoryPercent),
		},
		Network: aggregateNetwork(snapshot.Networks),
		BlockIO: aggregateBlockIO(snapshot.BlockIO),
	}, nil
}

func (s *Service) Logs(ctx context.Context, id, tail, since string) (Logs, error) {
	options, err := parseLogsOptions(tail, since)
	if err != nil {
		return Logs{}, err
	}
	stream, err := s.provider.Logs(ctx, id, options)
	if err != nil {
		return Logs{}, err
	}
	defer stream.Reader.Close()

	if !stream.Multiplexed {
		data, err := io.ReadAll(io.LimitReader(stream.Reader, maximumLogBytes+1))
		if err != nil {
			return Logs{}, fmt.Errorf("read container logs: %w", err)
		}
		truncated := len(data) > maximumLogBytes
		if truncated {
			data = data[:maximumLogBytes]
		}
		return Logs{Logs: string(data), Truncated: truncated}, nil
	}

	writer := &cappedBuffer{limit: maximumLogBytes}
	_, err = stdcopy.StdCopy(writer, writer, stream.Reader)
	if err != nil && !errors.Is(err, errLogLimitReached) {
		return Logs{}, fmt.Errorf("decode container logs: %w", err)
	}
	return Logs{Logs: writer.String(), Truncated: writer.truncated}, nil
}

func normalizeState(state string) string {
	switch strings.ToLower(state) {
	case "created", "running", "paused", "restarting", "removing", "exited", "dead":
		return strings.ToLower(state)
	default:
		return "unknown"
	}
}

func cpuPercent(cpu CPUCounters) float64 {
	if cpu.Usage < cpu.PreviousUsage || cpu.System <= cpu.PreviousSystem {
		return 0
	}
	cpuDelta := cpu.Usage - cpu.PreviousUsage
	systemDelta := cpu.System - cpu.PreviousSystem
	if cpuDelta == 0 || systemDelta == 0 {
		return 0
	}
	cores := cpu.OnlineCPUs
	if cores == 0 {
		cores = uint32(len(cpu.PerCPU))
	}
	if cores == 0 {
		cores = 1
	}
	return float64(cpuDelta) / float64(systemDelta) * float64(cores) * 100
}

func memoryUsage(memory MemoryCounters) uint64 {
	cache := memory.Stats["inactive_file"]
	if cache == 0 {
		cache = memory.Stats["total_inactive_file"]
	}
	if cache == 0 {
		cache = memory.Stats["cache"]
	}
	if cache > memory.Usage {
		return memory.Usage
	}
	return memory.Usage - cache
}

func aggregateNetwork(networks map[string]NetworkCounters) NetworkStats {
	var result NetworkStats
	for _, network := range networks {
		result.RXBytes += network.RXBytes
		result.TXBytes += network.TXBytes
	}
	return result
}

func aggregateBlockIO(entries []BlockIOEntry) BlockIOStats {
	var result BlockIOStats
	for _, entry := range entries {
		switch strings.ToLower(entry.Operation) {
		case "read":
			result.ReadBytes += entry.Value
		case "write":
			result.WriteBytes += entry.Value
		}
	}
	return result
}

func parseLogsOptions(tail, since string) (LogsOptions, error) {
	tailCount := defaultLogTail
	if tail != "" {
		value, err := strconv.Atoi(tail)
		if err != nil || value < 1 || value > maximumLogTail {
			return LogsOptions{}, fmt.Errorf("%w: tail must be between 1 and %d", ErrInvalidArgument, maximumLogTail)
		}
		tailCount = value
	}
	if since != "" && !validSince(since) {
		return LogsOptions{}, fmt.Errorf("%w: since must be a Unix timestamp, RFC3339 timestamp, or duration", ErrInvalidArgument)
	}
	return LogsOptions{Tail: tailCount, Since: since}, nil
}

func validSince(value string) bool {
	if len(value) > 128 {
		return false
	}
	if unix, err := strconv.ParseInt(value, 10, 64); err == nil {
		return unix >= 0
	}
	if _, err := time.Parse(time.RFC3339, value); err == nil {
		return true
	}
	duration, err := time.ParseDuration(value)
	return err == nil && duration >= 0
}

func roundPercent(value float64) float64 {
	return math.Round(value*10) / 10
}

type cappedBuffer struct {
	buffer    bytes.Buffer
	limit     int
	truncated bool
}

func (writer *cappedBuffer) Write(data []byte) (int, error) {
	remaining := writer.limit - writer.buffer.Len()
	if len(data) <= remaining {
		return writer.buffer.Write(data)
	}
	if remaining > 0 {
		_, _ = writer.buffer.Write(data[:remaining])
	}
	writer.truncated = true
	return remaining, errLogLimitReached
}

func (writer *cappedBuffer) String() string {
	return writer.buffer.String()
}
