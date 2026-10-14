//go:build linux

package system

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
)

type linuxProvider struct{}

func NewLinuxProvider() (Provider, error) {
	return &linuxProvider{}, nil
}

func (p *linuxProvider) SystemInfo(ctx context.Context) (Info, error) {
	if err := ctx.Err(); err != nil {
		return Info{}, err
	}

	hostname, err := os.Hostname()
	if err != nil {
		return Info{}, fmt.Errorf("read hostname: %w", err)
	}
	osReleaseData, err := os.ReadFile("/etc/os-release")
	if err != nil {
		return Info{}, fmt.Errorf("read /etc/os-release: %w", err)
	}
	osInfo, err := parseOSRelease(string(osReleaseData))
	if err != nil {
		return Info{}, err
	}

	var uname syscall.Utsname
	if err := syscall.Uname(&uname); err != nil {
		return Info{}, fmt.Errorf("uname: %w", err)
	}

	uptimeData, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return Info{}, fmt.Errorf("read /proc/uptime: %w", err)
	}
	uptime, err := parseUptime(string(uptimeData))
	if err != nil {
		return Info{}, err
	}

	return Info{
		Hostname: hostname,
		OS:       osInfo,
		Kernel: KernelInfo{
			Release:      int8String(uname.Release[:]),
			Architecture: int8String(uname.Machine[:]),
		},
		UptimeSeconds: uptime,
	}, nil
}

func (p *linuxProvider) CPUStats(ctx context.Context) (CPUStats, error) {
	if err := ctx.Err(); err != nil {
		return CPUStats{}, err
	}
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return CPUStats{}, fmt.Errorf("read /proc/stat: %w", err)
	}
	return parseCPUStat(string(data))
}

func (p *linuxProvider) MemoryInfo(ctx context.Context) (Memory, error) {
	if err := ctx.Err(); err != nil {
		return Memory{}, err
	}
	data, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return Memory{}, fmt.Errorf("read /proc/meminfo: %w", err)
	}
	return parseMemInfo(string(data))
}

func (p *linuxProvider) Filesystems(ctx context.Context) ([]Filesystem, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	mountData, err := os.ReadFile("/proc/self/mountinfo")
	if err != nil {
		return nil, fmt.Errorf("read /proc/self/mountinfo: %w", err)
	}
	mounts, err := parseMountInfo(string(mountData))
	if err != nil {
		return nil, err
	}

	candidates := []string{"/", "/data"}
	filesystems := make([]Filesystem, 0, len(candidates))
	for _, displayPath := range candidates {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		resolvedPath, err := filepath.EvalSymlinks(displayPath)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) && displayPath != "/" {
				continue
			}
			return nil, fmt.Errorf("resolve %s: %w", displayPath, err)
		}
		filesystemType, found := findFilesystemType(resolvedPath, mounts)
		if !found || !isUserFilesystem(filesystemType) {
			continue
		}
		filesystem, err := statFilesystem(displayPath, resolvedPath, filesystemType)
		if err != nil {
			return nil, err
		}
		filesystems = append(filesystems, filesystem)
	}
	if len(filesystems) == 0 {
		return nil, errors.New("no user filesystems found")
	}
	return filesystems, nil
}

func int8String(values []int8) string {
	bytes := make([]byte, 0, len(values))
	for _, value := range values {
		if value == 0 {
			break
		}
		bytes = append(bytes, byte(value))
	}
	return string(bytes)
}

func statFilesystem(displayPath, resolvedPath, filesystemType string) (Filesystem, error) {
	var stats syscall.Statfs_t
	if err := syscall.Statfs(resolvedPath, &stats); err != nil {
		return Filesystem{}, fmt.Errorf("statfs %s: %w", displayPath, err)
	}
	blockSize := uint64(stats.Bsize)
	total := stats.Blocks * blockSize
	free := stats.Bfree * blockSize
	available := stats.Bavail * blockSize
	used := total - free
	usage := float64(0)
	if total > 0 {
		usage = float64(used) / float64(total) * 100
	}
	return Filesystem{
		MountPoint:     displayPath,
		Filesystem:     filesystemType,
		TotalBytes:     total,
		UsedBytes:      used,
		AvailableBytes: available,
		UsagePercent:   roundPercent(usage),
	}, nil
}
