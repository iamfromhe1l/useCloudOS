# Platform and application data

PostgreSQL is the platform source of truth. Migrations record users, sessions,
settings, installed apps, versions, capability grants, events, notifications and
job foundation. Registry snapshots and normalized grants are written together
in one transaction. Browser launcher lists derive from this registry.

Core does not become every application's database. An app may own SQLite,
filesystem metadata or its own PostgreSQL database/schema. Migration hooks must
belong to that app; package rollback does not automatically undo data migrations.

Filesystem contract:

| Path                                    | Owner/purpose                                      |
| --------------------------------------- | -------------------------------------------------- |
| `/usr/local/bin/cloud-core`             | Platform executable                                |
| `/etc/usecloud`                         | Platform configuration and private dev credentials |
| `/var/lib/usecloud/apps/<id>/<version>` | Installed package binaries/assets                  |
| `/var/lib/usecloud/apps/<id>/current`   | Current version pointer                            |
| `/var/lib/usecloud/data/<id>`           | Persistent application data                        |
| `/run/usecloud/apps/<id>`               | Ephemeral sockets/state                            |
| `/var/lib/usecloud/catalog`             | Local development catalog packages                 |
| `/data/platform/postgresql`             | Persistent development PostgreSQL volume           |

Uninstall retains app data unless explicit purge is requested and confirmed.
Updates stage a new version, stop/start and health-check the service, preserve the
old artifact for rollback and only then switch metadata/current pointer.
This is a foundation, not a crash-proof transactional filesystem/database updater.
Concurrent multi-process installers, power-loss recovery and app data migration
hooks need a later durable-job design.

Development overrides package/data/catalog paths to `/data/platform/apps`,
`/data/platform/app-data` and `/data/platform/catalog`. Credentials are retained
privately under `/data/platform/config` and copied to `/etc/usecloud` on bootstrap.
Lima VM reset retains this disk. After reset, rerun bootstrap/install and restart
installed apps to recreate systemd units and sockets. Production uses the FHS
defaults and must back up registry and app data.
