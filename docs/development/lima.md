# Lima development environment

## Why Lima

macOS is the development host, while useCloudOS ultimately manages a Linux
server. Lima provides a real, headless Linux VM with its own kernel, systemd,
filesystems and rootful Docker daemon. Docker Desktop is neither required nor
used.

```text
macOS
├── IDE / terminal
├── browser (http://127.0.0.1:8080)
└── Lima VM: usecloud-dev
    ├── Debian 13 stable (native host architecture)
    ├── systemd
    ├── Docker Engine + /var/run/docker.sock
    ├── Go toolchain
    ├── repository mount: /workspace/usecloudos
    ├── persistent ext4 data: /data
    └── test services
```

The VM has four virtual CPUs, 8 GiB of RAM, a 64 GiB primary disk and no
display. A separate 32 GiB raw Lima disk supplies persistent `/data` storage.

## Supported hosts

Both supported hosts use native virtualization; no cross-architecture emulation
is involved:

```text
Intel Mac (x86_64)     -> VZ -> Debian 13 amd64
Apple Silicon (arm64)  -> VZ -> Debian 13 arm64
```

`scripts/vm-common` reads `uname -m`, normalizes `x86_64`/`amd64` to `amd64`
and `arm64`/`aarch64` to `arm64`, and selects the matching config automatically:

- `infra/lima/dev-amd64.yaml` — Intel Mac entry point;
- `infra/lima/dev-arm64.yaml` — Apple Silicon entry point;
- `infra/lima/dev-common.yaml` — shared resources, networking and provisioning.

Both configs use `vmType: vz`, Apple's Virtualization.framework backend. VZ
supports native x86_64 guests on Intel and native aarch64 guests on Apple
Silicon. Lima does not support cross-architecture VZ guests, which prevents an
accidental emulated setup. `LIMA_ARCH=amd64` or `LIMA_ARCH=arm64` is available
for diagnostics, but must match the physical host.

## Requirements

- Intel or Apple Silicon Mac;
- macOS 13 or newer (13.5 or newer is recommended for VZ);
- native Homebrew and Lima installation;
- enough space for sparse 64 GiB and 32 GiB disk images.

Install Lima; project scripts deliberately do not install host software:

```bash
brew install lima
```

## First start

```bash
git clone <repository-url>
cd useCloudOS
make vm-start
make vm-check
```

`make vm-start` detects the host, selects the matching Debian image and config,
creates the architecture-specific data disk if necessary, and creates or starts
the single user-facing VM named `usecloud-dev`. No architecture argument or YAML
editing is required.

Provisioning installs Git, curl, CA certificates, build tools, Docker Engine and
Go 1.27.1. The selected config downloads either `linux-amd64` or `linux-arm64`
from go.dev and verifies the architecture-specific SHA-256 checksum.

If `usecloud-dev` already exists with an architecture that does not match the
current host, `make vm-start` stops with a clear error. It never silently deletes
or recreates that VM. Run `make vm-reset` after reviewing the warning; `/data`
is retained unless `DELETE_DATA=1` is explicitly supplied.

## Daily work

```bash
make vm-start
make vm-shell
make vm-status
make vm-stop
```

`make vm-shell` starts in `/workspace/usecloudos`. `make vm-status` prints the
detected host architecture, selected config, existing guest architecture and
data-disk state. To run one command directly:

```bash
limactl shell usecloud-dev -- uname -a
```

Changes to a Lima config do not rewrite an existing instance. Reset and recreate
the VM when creation-time hardware, image, disk or mount settings change.

## Networking and HTTP

The primary browser path is identical on Intel and Apple Silicon:

```text
macOS browser -> http://127.0.0.1:8080 -> Lima static port forward
              -> cloud-core on VM port 8080
```

A backend listening on `0.0.0.0:8080` is therefore available at
<http://127.0.0.1:8080>. No bridge, `socket_vmnet`, root networking setup or LAN
exposure is required. The VM also has a VZ NAT address, which can be printed by:

```bash
make vm-ip
```

## Backend and frontend

Run `cloud-core` inside the VM:

```bash
make backend-run
curl http://127.0.0.1:8080/api/v1/health
```

The React/Vite frontend runs on macOS and proxies `/api` to that localhost
forward:

```bash
make frontend-install
make frontend-dev
```

See the [backend guide](backend.md) and [frontend guide](frontend.md) for the
application-specific workflows.

## Docker

Docker Engine and containerd run inside Debian as system services. The VM user
belongs to the `docker` group, so a fresh Lima shell can use Docker without
`sudo`:

```bash
docker version
docker ps
systemctl status docker
```

Docker automatically pulls the native image variant for the guest. The Docker
API smoke test deliberately uses multi-architecture `alpine:3.22` without a
hard-coded `--platform`:

```bash
make backend-docker-check
```

## Filesystems and data disks

The macOS checkout is mounted read/write through VirtioFS at
`/workspace/usecloudos`. This keeps host IDE and Git workflows simple. Go builds
work from the mount. Database data and watcher-heavy trees should use native
Linux storage if VirtioFS becomes a bottleneck; source is not copied to `/data`
automatically.

Architecture-specific Lima resources avoid attaching one disk across unrelated
guest installations:

- Intel: `usecloud-dev-data-amd64`;
- Apple Silicon: `usecloud-dev-data-arm64`.

Inside either VM the selected ext4 disk is exposed consistently as `/data` via
a symlink to `/mnt/lima-<disk-name>`. The original ARM-only disk name
`usecloud-dev-data` is detected and reused on Apple Silicon, preserving existing
development data.

Docker images and containers live under `/var/lib/docker` on the primary disk
and are removed with the VM. Files under `/data` survive a normal VM reset.

## Smoke checks

```bash
make vm-check
```

The check prints and compares normalized host and guest architectures, then
verifies Linux, systemd as PID 1, Docker and its socket, Docker access without
`sudo`, `/proc`, `/sys`, block devices, filesystems, `/data`, the repository
mount, Go, DNS and outbound networking.

Useful manual checks:

```bash
cat /proc/meminfo
cat /proc/cpuinfo
ls /sys
lsblk
df -h
systemctl
```

## Reset and data deletion

`make vm-reset` is interactive. It deletes `usecloud-dev` and its 64 GiB primary
disk but does not touch the host checkout or the attached persistent disk:

```bash
make vm-reset
make vm-start
```

To deliberately remove the selected architecture's `/data` disk too:

```bash
DELETE_DATA=1 make vm-reset
```

The prompt requires typing `usecloud-dev`. Automation can use `FORCE=1`, while
data deletion still requires the separate `DELETE_DATA=1` opt-in. Lima disk
deletion is irreversible.

## Troubleshooting

```bash
make vm-status
limactl --version
limactl shell usecloud-dev sudo journalctl -u cloud-final
limactl shell usecloud-dev sudo tail -n 200 /var/log/cloud-init-output.log
```

If an existing VM reports the wrong architecture, run `make vm-reset`, then
`make vm-start`. The data disk is retained by default. If Docker group membership
is absent in a shell opened during provisioning, exit it and open a new shell.
If port 8080 is occupied on macOS, stop that host process before starting the
VM or backend.

Direct Lima recovery commands remain available:

```bash
limactl stop usecloud-dev
limactl start usecloud-dev
limactl shell usecloud-dev
limactl list usecloud-dev
limactl disk list
```
