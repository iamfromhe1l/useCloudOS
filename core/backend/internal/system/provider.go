package system

import "context"

// Provider isolates Linux I/O from parsing, resource calculations, and HTTP.
type Provider interface {
	SystemInfo(context.Context) (Info, error)
	CPUStats(context.Context) (CPUStats, error)
	MemoryInfo(context.Context) (Memory, error)
	Filesystems(context.Context) ([]Filesystem, error)
}
