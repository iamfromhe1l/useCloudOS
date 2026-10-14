package docker

import (
	"context"
	"errors"
	"io"
	"time"
)

var (
	ErrNotFound        = errors.New("container not found")
	ErrConflict        = errors.New("container state conflict")
	ErrUnavailable     = errors.New("Docker Engine unavailable")
	ErrInvalidArgument = errors.New("invalid argument")
)

type EngineInfo struct {
	ServerVersion     string
	APIVersion        string
	Containers        int
	ContainersRunning int
	ContainersStopped int
	Images            int
}

type ContainerRecord struct {
	ID        string
	Name      string
	Image     string
	State     string
	Status    string
	CreatedAt time.Time
}

type ContainerInspection struct {
	ID           string
	Name         string
	Image        string
	State        string
	CreatedAt    time.Time
	StartedAt    time.Time
	RestartCount int
	Ports        []Port
}

type CPUCounters struct {
	Usage          uint64
	PreviousUsage  uint64
	System         uint64
	PreviousSystem uint64
	OnlineCPUs     uint32
	PerCPU         []uint64
}

type MemoryCounters struct {
	Usage uint64
	Limit uint64
	Stats map[string]uint64
}

type NetworkCounters struct {
	RXBytes uint64
	TXBytes uint64
}

type BlockIOEntry struct {
	Operation string
	Value     uint64
}

type StatsSnapshot struct {
	CPU      CPUCounters
	Memory   MemoryCounters
	Networks map[string]NetworkCounters
	BlockIO  []BlockIOEntry
}

type LogStream struct {
	Reader      io.ReadCloser
	Multiplexed bool
}

type Provider interface {
	Info(context.Context) (EngineInfo, error)
	List(context.Context) ([]ContainerRecord, error)
	Inspect(context.Context, string) (ContainerInspection, error)
	Start(context.Context, string) error
	Stop(context.Context, string) error
	Restart(context.Context, string) error
	Stats(context.Context, string) (StatsSnapshot, error)
	Logs(context.Context, string, LogsOptions) (LogStream, error)
	Close() error
}
