# Application development

```bash
brew install lima
make vm-start
make frontend-install
make dev
```

`make dev` starts existing Lima, bootstraps persistent PostgreSQL, installs Core
as native systemd service, builds a Containers package and preinstalls it through
the public installer only if absent, then starts Vite. Clean Core does not
preinstall product apps; this is an explicit developer convenience.

Core remains native. PostgreSQL alone is a development container inside Linux.
The existing Intel/Apple Silicon guest selection and port forwarding are unchanged.

```bash
make app-containers-build
make app-containers-test
make app-containers-pack
make backend-docker-check
```

App frontend and backend have independent build artifacts. For a new release,
bump app/package/manifest versions and element identity, build/pack, then use the
update API or uninstall/reinstall while preserving data. App HMR is not achieved
by importing it into Core at compile time. Core Vite HMR continues normally.

Use `scripts/platform-check` for fresh registry → install → service → gateway →
Docker lifecycle → uninstall → healthy Core proof. It refuses to remove an
already-installed user app. Playwright uses mock network only in tests and loads
the real independently built frontend artifact.

Root npm workspaces use matching SemVer dependencies: npm resolves local
workspaces automatically. npm does not implement pnpm's workspace:* protocol;
published consumers use the same versioned dependency declarations.
