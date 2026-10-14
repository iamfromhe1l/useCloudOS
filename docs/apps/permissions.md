# Capability registry v1

Manifest identifiers and human descriptions are exported by @usecloud/manifest
and `/api/v1/permissions`. Current capabilities cover system.read, app data,
media read/write, LAN/Internet, Docker read/manage, notifications and background
execution. The permission registry is versioned independently of app versions.

Install confirmation displays requested access and trust. Granted capabilities
are persisted transactionally with registry metadata. Gateway checks both the
declared route permission and its grant, then the authenticated user's role.
Unknown routes, permissions or uninstalled apps never default to unrestricted.

`usePermission`/`hasPermission` only controls UX. It does not enforce security.
An authenticated administrator may manage installed apps; ordinary-user policy
is currently read-only. Per-user app ACLs remain an additive foundation task.

Capabilities are not kernel confinement. In particular Docker daemon access is
root-equivalent even when a manifest calls it docker.read. A future privileged
broker must replace direct daemon access for strict least privilege. Do not
promise OS-level read-only enforcement that this implementation does not provide.
