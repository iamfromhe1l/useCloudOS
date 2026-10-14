# Native application services

Build a separate Linux executable and expose HTTP on the configured Unix socket.
Required endpoint: `GET /health` returns 200 only when the service is ready.
Business endpoints are relative to the service root, not platform `/api/v1`.

Core maps `/api/apps/<id>/...` to these paths after auth, registry and capability
checks. Never listen on a new localhost TCP port just to integrate with Core.
Never accept a frontend-provided user ID as authenticated identity.

Manager creates a dedicated `usecloud-app-<id>` system account and generated
systemd unit. It controls enable/start/stop/restart/disable and uses health checks
for availability. systemd/journald owns supervision and structured service logs.

Environment includes USECLOUD_APP_SOCKET and USECLOUD_APP_DATA. Package files and
data are separate. SIGINT/SIGTERM should shut down HTTP gracefully and clean the
socket. App failure must not terminate Core.

Containers is the reference backend: native Linux, Moby HTTP API, bounded logs,
tested stats, one service. Docker group access is temporary privileged capability
plumbing, not a universal permission sandbox. See security documentation.
