# useCloudOS

A personal cloud operating environment and modular application platform.
Core provides the platform; independently installable apps provide the features.

```text
core/        cloud-core and OS shell
apps/        independently built application UI/services (Containers first)
packages/    public UI, theme, app SDK, manifest and build tooling
examples/    external-developer starting points
infra/       Lima, systemd and deployment configuration
```

Core owns desktop, users/permissions, registry, installer and gateway. Containers
and Files are independently installed apps. Packages support Ed25519 signatures
and local publisher trust/revocation. Native app
backends run under systemd through private Unix sockets; frontend modules load
on demand as Custom Elements. Mature external web apps keep their own UI.

## Local development

macOS Intel and Apple Silicon use automatically selected headless Debian Lima.
Node and npm workspaces run frontend tooling on the host; Core/app services stay
native Linux. Development PostgreSQL runs inside the VM and persists under /data.

```bash
brew install lima
make vm-start
make frontend-install
make dev
```

Open http://127.0.0.1:5173. `make dev` explicitly preinstalls Containers through
the same package installer used by Store. A clean Core has only system apps.

Read [Lima](docs/development/lima.md), [backend](docs/development/backend.md),
[frontend](docs/development/frontend.md), [frontend architecture](docs/development/frontend-architecture.md),
[platform architecture](docs/architecture/README.md), [app developer guide](docs/apps/README.md)
and the [frozen design contract](docs/design/README.md).

Use `AUTH=required APPS=containers,files make dev` to enable real owner login and
both development apps. See [security](docs/security/README.md) for private bootstrap
credentials, session policy, signing and filesystem boundaries. `APPS=none` avoids
optional app builds/preinstall and leaves the current registry untouched.
