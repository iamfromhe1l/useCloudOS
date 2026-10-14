# Build applications for useCloudOS

Core owns the desktop, platform security and lifecycle. Applications own their
content and business domain. Start with [Build your first app](first-app.md).

- [Architecture](architecture.md): runtimes and independent artifacts.
- [Manifest](manifest.md): versioned metadata and validation.
- [Frontend](frontend.md): Custom Elements, Shadow DOM and public packages.
- [Backend](backend.md): Unix HTTP services and systemd.
- [Permissions](permissions.md): requested versus granted capabilities.
- [Packaging](packaging.md): reproducible ZIP `.usecloud` archives.
- [Security](security.md): trust and actual isolation boundaries.
- [Development](development.md): workspaces, commands and integration proof.

No Core source imports are required by an external developer. React and
@usecloud/ui are recommended for first-party UX, not required by the platform.
