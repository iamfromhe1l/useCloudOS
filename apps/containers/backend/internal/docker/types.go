package docker

import "time"

type Info struct {
	Available         bool   `json:"available"`
	ServerVersion     string `json:"server_version,omitempty"`
	APIVersion        string `json:"api_version,omitempty"`
	Containers        int    `json:"containers,omitempty"`
	ContainersRunning int    `json:"containers_running,omitempty"`
	ContainersStopped int    `json:"containers_stopped,omitempty"`
	Images            int    `json:"images,omitempty"`
}

type Container struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Image     string    `json:"image"`
	State     string    `json:"state"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Port struct {
	ContainerPort uint16 `json:"container_port"`
	HostPort      uint16 `json:"host_port"`
	Protocol      string `json:"protocol"`
}

type ContainerDetails struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Image        string    `json:"image"`
	State        string    `json:"state"`
	CreatedAt    time.Time `json:"created_at"`
	StartedAt    time.Time `json:"started_at"`
	RestartCount int       `json:"restart_count"`
	Ports        []Port    `json:"ports"`
}

type MemoryStats struct {
	UsedBytes    uint64  `json:"used_bytes"`
	LimitBytes   uint64  `json:"limit_bytes"`
	UsagePercent float64 `json:"usage_percent"`
}

type NetworkStats struct {
	RXBytes uint64 `json:"rx_bytes"`
	TXBytes uint64 `json:"tx_bytes"`
}

type BlockIOStats struct {
	ReadBytes  uint64 `json:"read_bytes"`
	WriteBytes uint64 `json:"write_bytes"`
}

type ContainerStats struct {
	CPUPercent float64      `json:"cpu_percent"`
	Memory     MemoryStats  `json:"memory"`
	Network    NetworkStats `json:"network"`
	BlockIO    BlockIOStats `json:"block_io"`
}

type Logs struct {
	Logs      string `json:"logs"`
	Truncated bool   `json:"truncated"`
}

type LogsOptions struct {
	Tail  int
	Since string
}
