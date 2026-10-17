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

Files is the second independent app. Use `AUTH=required APPS=containers,files make dev`
for an authenticated development shell with both apps. `APPS=none` keeps a clean
Core and avoids app builds. Existing installed packages are never silently replaced.
Fresh development setup requires login; existing bypass configuration is preserved
unless AUTH=required is explicit. See [authentication](../security/auth.md) for
private owner credentials, and [signing](../security/app-signing.md) for local keys.

`make app-files-pack` and Containers packing produce signed local development
packages. `make files-check` exercises verified installation, 32MiB streaming,
filesystem actions, revocation and uninstall with shared-data retention. It refuses
to delete an existing user-installed Files app. Files native unit tests run in Linux.

Opt-in real browser proof (requires running Core and a fresh registry):

```bash
USECLOUD_INTEGRATION=1 npm --prefix core/frontend run visual:test -- tests/platform-runtime.spec.ts --project=desktop --workers=1
```

PostgreSQL integration tests use USECLOUD_TEST_DATABASE_URL and create/drop an
isolated temporary schema. They exercise migrations, registry transactions,
bootstrap login, session protection and revocation; ordinary unit tests skip
this test without an explicit test database URL. Never point integration tests
at an account lacking permission to create an isolated schema.
