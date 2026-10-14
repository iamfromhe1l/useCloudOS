package system

import (
	"math"
	"testing"
)

func TestParseOSRelease(t *testing.T) {
	input := `# generated file
NAME="Debian GNU/Linux"
VERSION_ID="13"
PRETTY_NAME="Debian GNU/Linux 13 (trixie)"
HOME_URL="https://www.debian.org/"
`

	info, err := parseOSRelease(input)
	if err != nil {
		t.Fatalf("parseOSRelease() error = %v", err)
	}
	if info.Name != "Debian GNU/Linux" || info.Version != "13" {
		t.Fatalf("parseOSRelease() = %#v", info)
	}
}

func TestParseOSReleaseEscapes(t *testing.T) {
	input := "NAME=\"Example \\\"Linux\\\" \\$Edition\"\nVERSION_ID='1.0'\n"
	info, err := parseOSRelease(input)
	if err != nil {
		t.Fatalf("parseOSRelease() error = %v", err)
	}
	if info.Name != `Example "Linux" $Edition` || info.Version != "1.0" {
		t.Fatalf("parseOSRelease() = %#v", info)
	}
}

func TestParseOSReleaseRequiresName(t *testing.T) {
	if _, err := parseOSRelease("VERSION_ID=13\n"); err == nil {
		t.Fatal("parseOSRelease() expected an error")
	}
}

func TestParseMemInfo(t *testing.T) {
	input := `MemTotal:        8388608 kB
MemFree:         1048576 kB
MemAvailable:    5242880 kB
Buffers:          100000 kB
`

	memory, err := parseMemInfo(input)
	if err != nil {
		t.Fatalf("parseMemInfo() error = %v", err)
	}
	if memory.TotalBytes != 8*1024*1024*1024 {
		t.Fatalf("TotalBytes = %d", memory.TotalBytes)
	}
	if memory.AvailableBytes != 5*1024*1024*1024 {
		t.Fatalf("AvailableBytes = %d", memory.AvailableBytes)
	}
	if memory.UsedBytes != 3*1024*1024*1024 || memory.UsagePercent != 37.5 {
		t.Fatalf("memory = %#v", memory)
	}
}

func TestParseMemInfoRejectsMissingValues(t *testing.T) {
	if _, err := parseMemInfo("MemTotal: 100 kB\n"); err == nil {
		t.Fatal("parseMemInfo() expected an error")
	}
}

func TestParseCPUStat(t *testing.T) {
	input := `cpu  100 5 25 800 20 2 3 4 99 88
cpu0 50 2 12 400 10 1 1 2 50 40
intr 1234
`

	stats, err := parseCPUStat(input)
	if err != nil {
		t.Fatalf("parseCPUStat() error = %v", err)
	}
	if stats.Total != 959 {
		t.Fatalf("Total = %d, want 959", stats.Total)
	}
	if stats.Idle != 820 {
		t.Fatalf("Idle = %d, want 820", stats.Idle)
	}
}

func TestCPUUsagePercentUsesCounterDelta(t *testing.T) {
	usage, err := cpuUsagePercent(
		CPUStats{Total: 1000, Idle: 700},
		CPUStats{Total: 1200, Idle: 800},
	)
	if err != nil {
		t.Fatalf("cpuUsagePercent() error = %v", err)
	}
	if math.Abs(usage-50) > 0.001 {
		t.Fatalf("usage = %f, want 50", usage)
	}
}

func TestParseUptime(t *testing.T) {
	seconds, err := parseUptime("12345.67 98765.43\n")
	if err != nil {
		t.Fatalf("parseUptime() error = %v", err)
	}
	if seconds != 12345 {
		t.Fatalf("seconds = %d", seconds)
	}
}

func TestParseAndFilterMountInfo(t *testing.T) {
	input := `29 23 0:25 / / rw,relatime - ext4 /dev/vda1 rw
30 29 0:26 / /proc rw,nosuid,nodev,noexec - proc proc rw
31 29 0:27 / /sys rw,nosuid,nodev,noexec - sysfs sysfs rw
44 29 254:16 / /mnt/lima-usecloud-dev-data rw,relatime - ext4 /dev/vdb rw
45 29 0:48 / /workspace/usecloudos rw,relatime - virtiofs mount0 rw
46 29 0:49 / /path\040with\040spaces rw,relatime - virtiofs mount1 rw
`

	mounts, err := parseMountInfo(input)
	if err != nil {
		t.Fatalf("parseMountInfo() error = %v", err)
	}
	tests := []struct {
		path       string
		filesystem string
		relevant   bool
	}{
		{path: "/", filesystem: "ext4", relevant: true},
		{path: "/proc/1", filesystem: "proc", relevant: false},
		{path: "/mnt/lima-usecloud-dev-data/test", filesystem: "ext4", relevant: true},
		{path: "/path with spaces/file", filesystem: "virtiofs", relevant: true},
	}
	for _, test := range tests {
		filesystem, found := findFilesystemType(test.path, mounts)
		if !found || filesystem != test.filesystem {
			t.Errorf("findFilesystemType(%q) = %q, %v", test.path, filesystem, found)
			continue
		}
		if relevant := isUserFilesystem(filesystem); relevant != test.relevant {
			t.Errorf("isUserFilesystem(%q) = %v", filesystem, relevant)
		}
	}
}
