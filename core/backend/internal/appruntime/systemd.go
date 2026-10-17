// Package appruntime delegates supervision to systemd, never a custom supervisor.
package appruntime

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"usecloudos/backend/internal/registry"
)

type Systemd struct{ UnitRoot, SocketRoot, SharedRoot string }

func (s Systemd) Socket(a registry.Application) string {
	return filepath.Join(s.SocketRoot, a.Manifest.Metadata.ID, a.Manifest.Backend.Socket)
}
func unit(a registry.Application) string {
	return "usecloud-app-" + a.Manifest.Metadata.ID + ".service"
}
func command(ctx context.Context, name string, args ...string) error {
	output, err := exec.CommandContext(ctx, name, args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s failed: %w (%s)", name, err, strings.TrimSpace(string(output)))
	}
	return nil
}
func (s Systemd) Start(ctx context.Context, a registry.Application) error {
	if a.Manifest.Runtime.Type == "container" {
		return (OCI{}).Start(ctx, a)
	}
	if a.Manifest.Backend == nil {
		return nil
	}
	user := "usecloud-app-" + a.Manifest.Metadata.ID
	if len(user) > 31 {
		digest := sha256.Sum256([]byte(a.Manifest.Metadata.ID))
		user = fmt.Sprintf("usecloud-app-%x", digest[:8])
	}
	if err := os.Chmod(filepath.Dir(filepath.Dir(a.InstallPath)), 0751); err != nil {
		return err
	}
	if err := os.Chmod(filepath.Dir(a.DataPath), 0751); err != nil {
		return err
	}
	if err := exec.CommandContext(ctx, "id", "-u", user).Run(); err != nil {
		if err = command(ctx, "useradd", "--system", "--no-create-home", "--shell", "/usr/sbin/nologin", user); err != nil {
			return err
		}
	}
	if err := command(ctx, "chown", "-R", "root:"+user, filepath.Dir(a.InstallPath)); err != nil {
		return err
	}
	if err := os.Chmod(a.InstallPath, 0750); err != nil {
		return err
	}
	if err := command(ctx, "chown", "-R", user+":"+user, a.DataPath); err != nil {
		return err
	}
	docker := ""
	granted := "0"
	// A read-only grant must not silently become root-equivalent socket access.
	// A future read broker can provide it without this privileged group.
	if a.Has("docker.manage") {
		docker = "SupplementaryGroups=docker\n"
		granted = "1"
	}
	config := fmt.Sprintf("[Unit]\nDescription=useCloudOS application %s\nAfter=network.target\n[Service]\nType=simple\nUser=%s\nGroup=%s\n%sExecStart=%s\nEnvironment=USECLOUD_APP_SOCKET=%s\nEnvironment=USECLOUD_APP_DATA=%s\nEnvironment=USECLOUD_DOCKER_GRANTED=%s\nRuntimeDirectory=usecloud/apps/%s\nRuntimeDirectoryMode=0750\nRestart=on-failure\nRestartSec=3\nTimeoutStopSec=15\nNoNewPrivileges=true\nPrivateTmp=true\nProtectSystem=strict\nProtectHome=true\nReadWritePaths=%s /run/usecloud/apps/%s\nUMask=0027\n[Install]\nWantedBy=multi-user.target\n", a.Manifest.Metadata.ID, user, user, docker, filepath.Join(a.InstallPath, a.Manifest.Backend.Executable), s.Socket(a), a.DataPath, granted, a.Manifest.Metadata.ID, a.DataPath, a.Manifest.Metadata.ID)
	storage := ""
	if a.Has("storage.shared.read") || a.Has("storage.shared.write") {
		if !filepath.IsAbs(s.SharedRoot) || filepath.Clean(s.SharedRoot) == "/" || strings.ContainsAny(s.SharedRoot, "\n\r %") {
			return fmt.Errorf("invalid platform shared storage root")
		}
		if exec.CommandContext(ctx, "getent", "group", "usecloud-storage").Run() != nil {
			if err := command(ctx, "groupadd", "--system", "usecloud-storage"); err != nil {
				return err
			}
		}
		if err := os.MkdirAll(s.SharedRoot, 02770); err != nil {
			return err
		}
		if err := command(ctx, "chown", "root:usecloud-storage", s.SharedRoot); err != nil {
			return err
		}
		if err := os.Chmod(s.SharedRoot, os.ModeSetgid|0770); err != nil {
			return err
		}
		storage = "SupplementaryGroups=usecloud-storage\nUMask=0007\nEnvironment=USECLOUD_STORAGE_ROOT=" + s.SharedRoot + "\n"
		if a.Has("storage.shared.write") {
			storage += "Environment=USECLOUD_STORAGE_WRITE=1\nReadWritePaths=" + s.SharedRoot + "\n"
		} else {
			storage += "ReadOnlyPaths=" + s.SharedRoot + "\n"
		}
	}
	families := "AF_UNIX"
	if a.Has("network.lan") || a.Has("network.internet") {
		families += " AF_INET AF_INET6"
	}
	// RestrictSUIDSGID blocks openat2 outright: seccomp cannot inspect its
	// indirect mode argument. Root-safe shared storage requires this syscall.
	suid := "true"
	if storage != "" {
		suid = "false"
	}
	config = strings.Replace(config, "[Install]", storage+"CapabilityBoundingSet=\nRestrictSUIDSGID="+suid+"\nRestrictAddressFamilies="+families+"\n[Install]", 1)
	if err := os.MkdirAll(s.UnitRoot, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(s.UnitRoot, unit(a)), []byte(config), 0644); err != nil {
		return err
	}
	if err := command(ctx, "systemctl", "daemon-reload"); err != nil {
		return err
	}
	if err := command(ctx, "systemctl", "enable", "--now", unit(a)); err != nil {
		return err
	}
	deadline := time.Now().Add(8 * time.Second)
	for time.Now().Before(deadline) {
		if s.Status(ctx, a) == "running" {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(100 * time.Millisecond):
		}
	}
	return fmt.Errorf("application health check failed")
}
func (s Systemd) Stop(ctx context.Context, a registry.Application) error {
	if a.Manifest.Runtime.Type == "container" {
		return (OCI{}).Stop(ctx, a)
	}
	if a.Manifest.Backend == nil {
		return nil
	}
	return command(ctx, "systemctl", "stop", unit(a))
}
func (s Systemd) Remove(ctx context.Context, a registry.Application) error {
	if a.Manifest.Runtime.Type == "container" {
		return (OCI{}).Remove(ctx, a)
	}
	if a.Manifest.Backend == nil {
		return nil
	}
	if err := command(ctx, "systemctl", "disable", unit(a)); err != nil {
		return err
	}
	if err := os.Remove(filepath.Join(s.UnitRoot, unit(a))); err != nil && !os.IsNotExist(err) {
		return err
	}
	return command(ctx, "systemctl", "daemon-reload")
}
func (s Systemd) Status(ctx context.Context, a registry.Application) string {
	if a.Manifest.Runtime.Type == "container" {
		return (OCI{}).Status(ctx, a)
	}
	if a.Manifest.Backend == nil {
		return "ready"
	}
	if err := exec.CommandContext(ctx, "systemctl", "is-active", "--quiet", unit(a)).Run(); err != nil {
		if exec.CommandContext(ctx, "systemctl", "is-failed", "--quiet", unit(a)).Run() == nil {
			return "failed"
		}
		return "stopped"
	}
	transport := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "unix", s.Socket(a))
	}}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: time.Second}
	request, _ := http.NewRequestWithContext(ctx, "GET", "http://app/health", nil)
	response, err := client.Do(request)
	if err != nil {
		return "failed"
	}
	response.Body.Close()
	if response.StatusCode != 200 {
		return "failed"
	}
	return "running"
}
