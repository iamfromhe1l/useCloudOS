# Backend development

`core/backend` builds Linux-only cloud-core. `apps/containers/backend` independently
builds containers-service. Root go.work includes both modules, not one giant binary.

Core platform APIs retain `/api/v1/health`, `/version`, `/system/info`,
`/system/resources` and `/storage/filesystems`. Real Linux data still uses
os-release, uname, /proc/stat interval sampling, /proc/meminfo, mountinfo and statfs.
Parsing remains separated from I/O and covered by fixtures.

Core also owns sessions, registry, package inspection/installation/update/removal,
catalog, notifications/events and application gateway. It has no Moby dependency
or container business handlers. Docker API now lives in the installable app,
browser-visible under `/api/apps/containers/...`.

```bash
make vm-start
make backend-build
make backend-test
make backend-lint
make backend-install
```

backend-install bootstraps PostgreSQL 18.6 in Lima, builds Core, installs its
systemd unit and config, runs embedded migrations and starts the native service.
Root is temporary for systemd/install orchestration; apps run as dedicated users.
For foreground debugging, stop cloud-core.service first, then make backend-run.

Development credentials/config and app packages/data persist on the separate
/data disk. Config is copied privately to /etc/usecloud/dev.env. Explicit local
auth/unsigned-embedded development policies are never production defaults.
Production requires CLOUD_CORE_DATABASE_URL, owner bootstrap password, HTTPS and
Secure cookies. See docs/architecture/security.md for hardening gaps.

Build version/commit/time still use ldflags in scripts/backend-common. HTTP remains
net/http with slog and graceful signals; app services use bounded Unix HTTP APIs.

```bash
curl http://127.0.0.1:8080/api/v1/system/info
curl http://127.0.0.1:8080/api/v1/apps
curl http://127.0.0.1:8080/api/apps/containers/docker/info
```

For Containers installation/build/smoke and permission model, read
[application development](../apps/development.md) and [backend contract](../apps/backend.md).
