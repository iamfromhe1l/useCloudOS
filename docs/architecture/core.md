# Core ownership

`core/backend` is a modular monolith. System information, resource sampling and
mounted filesystems remain platform APIs. `manifest`, `apppackage`, `registry`,
`appmanager`, `appruntime`, `auth`, `database`, `gateway`, `events` and `platform`
are internal domain packages, not network microservices.

Core owns users/sessions, capability checks, installed metadata, package
validation, lifecycle orchestration, static assets and the browser API gateway.
It does not import Moby or implement container list/stats/logs/lifecycle.

`core/frontend` owns wallpaper, SystemBar, Dock, Control Center, desktop widgets,
Settings, Store and AppHost. Application icons come from `/api/v1/apps`, including
Core-owned system destinations. Containers is not a compile-time route.

Catalog currently reads local `.usecloud` packages. Install/sideload and
Settings Apps use the same manager and PostgreSQL registry. Remote discovery,
platform upgrades and richer job scheduling are extension points, not fake
implemented features.
