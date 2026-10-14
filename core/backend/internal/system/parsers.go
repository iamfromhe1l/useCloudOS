package system

import (
	"bufio"
	"errors"
	"fmt"
	"math"
	"path/filepath"
	"strconv"
	"strings"
)

func parseOSRelease(input string) (OSInfo, error) {
	values := make(map[string]string)
	scanner := bufio.NewScanner(strings.NewReader(input))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, raw, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		value, err := parseOSReleaseValue(strings.TrimSpace(raw))
		if err != nil {
			return OSInfo{}, fmt.Errorf("parse %s: %w", key, err)
		}
		values[key] = value
	}
	if err := scanner.Err(); err != nil {
		return OSInfo{}, fmt.Errorf("scan os-release: %w", err)
	}

	name := values["NAME"]
	if name == "" {
		name = values["PRETTY_NAME"]
	}
	if name == "" {
		return OSInfo{}, errors.New("os-release does not contain NAME")
	}

	version := values["VERSION_ID"]
	if version == "" {
		version = values["VERSION"]
	}
	return OSInfo{Name: name, Version: version}, nil
}

func parseOSReleaseValue(value string) (string, error) {
	if len(value) < 2 {
		return value, nil
	}
	quote := value[0]
	if quote != '\'' && quote != '"' {
		return value, nil
	}
	if value[len(value)-1] != quote {
		return "", errors.New("unterminated quoted value")
	}
	value = value[1 : len(value)-1]
	if quote == '\'' {
		return value, nil
	}

	var result strings.Builder
	for index := 0; index < len(value); index++ {
		if value[index] == '\\' && index+1 < len(value) {
			next := value[index+1]
			if next == '\\' || next == '"' || next == '$' || next == '`' {
				result.WriteByte(next)
				index++
				continue
			}
		}
		result.WriteByte(value[index])
	}
	return result.String(), nil
}

func parseMemInfo(input string) (Memory, error) {
	values := make(map[string]uint64)
	scanner := bufio.NewScanner(strings.NewReader(input))
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 2 {
			continue
		}
		key := strings.TrimSuffix(fields[0], ":")
		if key != "MemTotal" && key != "MemAvailable" {
			continue
		}
		amount, err := strconv.ParseUint(fields[1], 10, 64)
		if err != nil {
			return Memory{}, fmt.Errorf("parse %s: %w", key, err)
		}
		if len(fields) < 3 || fields[2] != "kB" {
			unit := "missing"
			if len(fields) >= 3 {
				unit = fields[2]
			}
			return Memory{}, fmt.Errorf("unsupported unit for %s: %s", key, unit)
		}
		if amount > math.MaxUint64/1024 {
			return Memory{}, fmt.Errorf("%s overflows bytes", key)
		}
		values[key] = amount * 1024
	}
	if err := scanner.Err(); err != nil {
		return Memory{}, fmt.Errorf("scan meminfo: %w", err)
	}

	total, hasTotal := values["MemTotal"]
	available, hasAvailable := values["MemAvailable"]
	if !hasTotal || !hasAvailable {
		return Memory{}, errors.New("meminfo is missing MemTotal or MemAvailable")
	}
	if available > total || total == 0 {
		return Memory{}, errors.New("meminfo contains invalid memory values")
	}
	used := total - available
	return Memory{
		TotalBytes:     total,
		AvailableBytes: available,
		UsedBytes:      used,
		UsagePercent:   roundPercent(float64(used) / float64(total) * 100),
	}, nil
}

func parseCPUStat(input string) (CPUStats, error) {
	scanner := bufio.NewScanner(strings.NewReader(input))
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) == 0 || fields[0] != "cpu" {
			continue
		}
		if len(fields) < 5 {
			return CPUStats{}, errors.New("aggregate CPU line has too few counters")
		}

		counters := make([]uint64, 0, 8)
		for _, field := range fields[1:] {
			value, err := strconv.ParseUint(field, 10, 64)
			if err != nil {
				return CPUStats{}, fmt.Errorf("parse CPU counter: %w", err)
			}
			counters = append(counters, value)
			if len(counters) == 8 {
				break
			}
		}

		var total uint64
		for _, value := range counters {
			if math.MaxUint64-total < value {
				return CPUStats{}, errors.New("CPU counters overflow")
			}
			total += value
		}
		idle := counters[3]
		if len(counters) > 4 {
			idle += counters[4]
		}
		return CPUStats{Total: total, Idle: idle}, nil
	}
	if err := scanner.Err(); err != nil {
		return CPUStats{}, fmt.Errorf("scan proc stat: %w", err)
	}
	return CPUStats{}, errors.New("proc stat does not contain aggregate CPU counters")
}

func parseUptime(input string) (uint64, error) {
	fields := strings.Fields(input)
	if len(fields) == 0 {
		return 0, errors.New("proc uptime is empty")
	}
	seconds, err := strconv.ParseFloat(fields[0], 64)
	if err != nil || seconds < 0 {
		return 0, errors.New("proc uptime contains an invalid value")
	}
	return uint64(seconds), nil
}

type mountInfo struct {
	MountPoint string
	Filesystem string
}

func parseMountInfo(input string) ([]mountInfo, error) {
	var mounts []mountInfo
	scanner := bufio.NewScanner(strings.NewReader(input))
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		separator := -1
		for index, field := range fields {
			if field == "-" {
				separator = index
				break
			}
		}
		if len(fields) < 6 || separator < 0 || separator+1 >= len(fields) {
			return nil, errors.New("invalid mountinfo line")
		}
		mounts = append(mounts, mountInfo{
			MountPoint: unescapeMountInfo(fields[4]),
			Filesystem: fields[separator+1],
		})
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scan mountinfo: %w", err)
	}
	return mounts, nil
}

func unescapeMountInfo(value string) string {
	replacer := strings.NewReplacer(
		`\040`, " ",
		`\011`, "\t",
		`\012`, "\n",
		`\134`, `\`,
	)
	return replacer.Replace(value)
}

func findFilesystemType(path string, mounts []mountInfo) (string, bool) {
	path = filepath.Clean(path)
	bestLength := -1
	filesystem := ""
	for _, mount := range mounts {
		mountPoint := filepath.Clean(mount.MountPoint)
		if path != mountPoint && mountPoint != "/" && !strings.HasPrefix(path, mountPoint+"/") {
			continue
		}
		if len(mountPoint) > bestLength {
			bestLength = len(mountPoint)
			filesystem = mount.Filesystem
		}
	}
	return filesystem, bestLength >= 0
}

func isUserFilesystem(filesystem string) bool {
	pseudo := map[string]struct{}{
		"autofs": {}, "bpf": {}, "cgroup": {}, "cgroup2": {}, "configfs": {},
		"debugfs": {}, "devpts": {}, "devtmpfs": {}, "efivarfs": {}, "fusectl": {},
		"hugetlbfs": {}, "mqueue": {}, "proc": {}, "pstore": {}, "securityfs": {},
		"sysfs": {}, "tmpfs": {}, "tracefs": {},
	}
	_, excluded := pseudo[filesystem]
	return filesystem != "" && !excluded
}
