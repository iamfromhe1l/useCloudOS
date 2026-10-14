package docker

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	cerrdefs "github.com/containerd/errdefs"
	containertypes "github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

const dockerSocket = "unix:///var/run/docker.sock"

type mobyProvider struct {
	client *client.Client
}

func NewMobyProvider() (Provider, error) {
	apiClient, err := client.New(client.WithHost(dockerSocket))
	if err != nil {
		return nil, fmt.Errorf("create Docker client: %w", err)
	}
	return &mobyProvider{client: apiClient}, nil
}

func (p *mobyProvider) Close() error {
	return p.client.Close()
}

func (p *mobyProvider) Info(ctx context.Context) (EngineInfo, error) {
	version, err := p.client.ServerVersion(ctx, client.ServerVersionOptions{})
	if err != nil {
		return EngineInfo{}, normalizeError(err)
	}
	info, err := p.client.Info(ctx, client.InfoOptions{})
	if err != nil {
		return EngineInfo{}, normalizeError(err)
	}
	return EngineInfo{
		ServerVersion:     version.Version,
		APIVersion:        version.APIVersion,
		Containers:        info.Info.Containers,
		ContainersRunning: info.Info.ContainersRunning,
		ContainersStopped: info.Info.ContainersStopped,
		Images:            info.Info.Images,
	}, nil
}

func (p *mobyProvider) List(ctx context.Context) ([]ContainerRecord, error) {
	result, err := p.client.ContainerList(ctx, client.ContainerListOptions{All: true})
	if err != nil {
		return nil, normalizeError(err)
	}
	containers := make([]ContainerRecord, 0, len(result.Items))
	for _, item := range result.Items {
		containers = append(containers, mapContainerSummary(item))
	}
	return containers, nil
}

func (p *mobyProvider) Inspect(ctx context.Context, id string) (ContainerInspection, error) {
	result, err := p.client.ContainerInspect(ctx, id, client.ContainerInspectOptions{})
	if err != nil {
		return ContainerInspection{}, normalizeError(err)
	}
	return mapContainerInspection(result.Container), nil
}

func (p *mobyProvider) Start(ctx context.Context, id string) error {
	_, err := p.client.ContainerStart(ctx, id, client.ContainerStartOptions{})
	return normalizeError(err)
}

func (p *mobyProvider) Stop(ctx context.Context, id string) error {
	_, err := p.client.ContainerStop(ctx, id, client.ContainerStopOptions{})
	return normalizeError(err)
}

func (p *mobyProvider) Restart(ctx context.Context, id string) error {
	_, err := p.client.ContainerRestart(ctx, id, client.ContainerRestartOptions{})
	return normalizeError(err)
}

func (p *mobyProvider) Stats(ctx context.Context, id string) (StatsSnapshot, error) {
	result, err := p.client.ContainerStats(ctx, id, client.ContainerStatsOptions{
		Stream:                false,
		IncludePreviousSample: true,
	})
	if err != nil {
		return StatsSnapshot{}, normalizeError(err)
	}
	defer result.Body.Close()

	var stats containertypes.StatsResponse
	if err := json.NewDecoder(result.Body).Decode(&stats); err != nil {
		return StatsSnapshot{}, fmt.Errorf("decode Docker stats: %w", err)
	}
	return mapStatsSnapshot(stats), nil
}

func (p *mobyProvider) Logs(ctx context.Context, id string, options LogsOptions) (LogStream, error) {
	inspection, err := p.client.ContainerInspect(ctx, id, client.ContainerInspectOptions{})
	if err != nil {
		return LogStream{}, normalizeError(err)
	}
	logs, err := p.client.ContainerLogs(ctx, id, client.ContainerLogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       strconv.Itoa(options.Tail),
		Since:      options.Since,
	})
	if err != nil {
		return LogStream{}, normalizeError(err)
	}
	tty := inspection.Container.Config != nil && inspection.Container.Config.Tty
	return LogStream{Reader: logs, Multiplexed: !tty}, nil
}

func mapContainerSummary(item containertypes.Summary) ContainerRecord {
	name := ""
	if len(item.Names) > 0 {
		name = strings.TrimPrefix(item.Names[0], "/")
	}
	return ContainerRecord{
		ID:        item.ID,
		Name:      name,
		Image:     item.Image,
		State:     string(item.State),
		Status:    item.Status,
		CreatedAt: time.Unix(item.Created, 0).UTC(),
	}
}

func mapContainerInspection(item containertypes.InspectResponse) ContainerInspection {
	image := ""
	if item.Config != nil {
		image = item.Config.Image
	}
	state := mapInspectState(item.State)
	startedAt := time.Time{}
	if item.State != nil {
		startedAt = parseDockerTime(item.State.StartedAt)
	}
	ports := mapPorts(item.NetworkSettings)
	return ContainerInspection{
		ID:           item.ID,
		Name:         strings.TrimPrefix(item.Name, "/"),
		Image:        image,
		State:        state,
		CreatedAt:    parseDockerTime(item.Created),
		StartedAt:    startedAt,
		RestartCount: item.RestartCount,
		Ports:        ports,
	}
}

func mapInspectState(state *containertypes.State) string {
	if state == nil {
		return "unknown"
	}
	if state.Status != "" {
		return normalizeState(string(state.Status))
	}
	switch {
	case state.Dead:
		return "dead"
	case state.Restarting:
		return "restarting"
	case state.Paused:
		return "paused"
	case state.Running:
		return "running"
	default:
		return "exited"
	}
}

func mapPorts(settings *containertypes.NetworkSettings) []Port {
	ports := []Port{}
	if settings == nil {
		return ports
	}
	for containerPort, bindings := range settings.Ports {
		if len(bindings) == 0 {
			ports = append(ports, Port{
				ContainerPort: containerPort.Num(),
				Protocol:      string(containerPort.Proto()),
			})
			continue
		}
		for _, binding := range bindings {
			hostPort, _ := strconv.ParseUint(binding.HostPort, 10, 16)
			ports = append(ports, Port{
				ContainerPort: containerPort.Num(),
				HostPort:      uint16(hostPort),
				Protocol:      string(containerPort.Proto()),
			})
		}
	}
	sort.Slice(ports, func(left, right int) bool {
		if ports[left].ContainerPort != ports[right].ContainerPort {
			return ports[left].ContainerPort < ports[right].ContainerPort
		}
		if ports[left].HostPort != ports[right].HostPort {
			return ports[left].HostPort < ports[right].HostPort
		}
		return ports[left].Protocol < ports[right].Protocol
	})
	return ports
}

func mapStatsSnapshot(stats containertypes.StatsResponse) StatsSnapshot {
	networks := make(map[string]NetworkCounters, len(stats.Networks))
	for name, network := range stats.Networks {
		networks[name] = NetworkCounters{RXBytes: network.RxBytes, TXBytes: network.TxBytes}
	}
	blockIO := make([]BlockIOEntry, 0, len(stats.BlkioStats.IoServiceBytesRecursive))
	for _, entry := range stats.BlkioStats.IoServiceBytesRecursive {
		blockIO = append(blockIO, BlockIOEntry{Operation: entry.Op, Value: entry.Value})
	}
	return StatsSnapshot{
		CPU: CPUCounters{
			Usage:          stats.CPUStats.CPUUsage.TotalUsage,
			PreviousUsage:  stats.PreCPUStats.CPUUsage.TotalUsage,
			System:         stats.CPUStats.SystemUsage,
			PreviousSystem: stats.PreCPUStats.SystemUsage,
			OnlineCPUs:     stats.CPUStats.OnlineCPUs,
			PerCPU:         stats.CPUStats.CPUUsage.PercpuUsage,
		},
		Memory: MemoryCounters{
			Usage: stats.MemoryStats.Usage,
			Limit: stats.MemoryStats.Limit,
			Stats: stats.MemoryStats.Stats,
		},
		Networks: networks,
		BlockIO:  blockIO,
	}
}

func parseDockerTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		return time.Time{}
	}
	return parsed.UTC()
}

func normalizeError(err error) error {
	if err == nil {
		return nil
	}
	switch {
	case cerrdefs.IsNotFound(err):
		return fmt.Errorf("%w: %v", ErrNotFound, err)
	case cerrdefs.IsConflict(err), cerrdefs.IsNotModified(err), cerrdefs.IsFailedPrecondition(err):
		return fmt.Errorf("%w: %v", ErrConflict, err)
	case cerrdefs.IsUnavailable(err), cerrdefs.IsPermissionDenied(err), client.IsErrConnectionFailed(err), errors.Is(err, os.ErrNotExist), errors.Is(err, os.ErrPermission):
		return fmt.Errorf("%w: %v", ErrUnavailable, err)
	case cerrdefs.IsInvalidArgument(err):
		return fmt.Errorf("%w: %v", ErrInvalidArgument, err)
	default:
		return err
	}
}
