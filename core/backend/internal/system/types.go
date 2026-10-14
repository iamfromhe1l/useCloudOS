package system

type OSInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type KernelInfo struct {
	Release      string `json:"release"`
	Architecture string `json:"architecture"`
}

type Info struct {
	Hostname      string     `json:"hostname"`
	OS            OSInfo     `json:"os"`
	Kernel        KernelInfo `json:"kernel"`
	UptimeSeconds uint64     `json:"uptime_seconds"`
}

type CPU struct {
	LogicalCores int     `json:"logical_cores"`
	UsagePercent float64 `json:"usage_percent"`
}

type Memory struct {
	TotalBytes     uint64  `json:"total_bytes"`
	AvailableBytes uint64  `json:"available_bytes"`
	UsedBytes      uint64  `json:"used_bytes"`
	UsagePercent   float64 `json:"usage_percent"`
}

type Resources struct {
	CPU    CPU    `json:"cpu"`
	Memory Memory `json:"memory"`
}

type Filesystem struct {
	MountPoint     string  `json:"mount_point"`
	Filesystem     string  `json:"filesystem"`
	TotalBytes     uint64  `json:"total_bytes"`
	UsedBytes      uint64  `json:"used_bytes"`
	AvailableBytes uint64  `json:"available_bytes"`
	UsagePercent   float64 `json:"usage_percent"`
}

type CPUStats struct {
	Total uint64
	Idle  uint64
}
