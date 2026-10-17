# useCloudOS Project Context

> Canonical cross-session context for ChatGPT/Codex work on useCloudOS.
>
> Read this file together with `AGENTS.md`, `docs/architecture/*`,
> `docs/apps/*`, `docs/design/*`, and
> `docs/development/frontend-architecture.md` before substantial work.

## Project identity

useCloudOS is a personal/home cloud operating environment and modular
application platform. It is inspired by the product category of UmbrelOS/CasaOS
and by end-4 / illogical-impulse desktop-shell ideas, but it must remain an
original useCloudOS product.

The product is Linux/Debian based. The initial development environment is a
headless Lima VM on macOS. The current host used in development is Intel x86_64,
but the project keeps amd64/arm64 compatibility in mind.

The project intentionally uses a single Git monorepo.

## Product direction

A fresh useCloudOS installation should contain a small platform Core and OS
shell, not every product feature.

Core provides the platform:
- desktop/shell;
- System Bar;
- Dock;
- Control Center;
- Settings;
- users/auth/session foundation;
- permissions;
- App Registry;
- App Manager / installer;
- Store/catalog foundation;
- platform/system APIs;
- Core gateway;
- events/notifications foundation;
- platform updates foundation.

Product capabilities that can be independently installed belong in apps:
- Containers;
- Files;
- Backup;
- Photos;
- future first-party applications;
- third-party/container applications.

Core provides the platform; apps provide the features.

## Current repository architecture

Canonical high-level structure:

```
core/
  backend/              cloud-core
  frontend/             OS shell

apps/
  containers/
    backend/            containers-service
    frontend/           independent Custom Element
    manifest/

packages/
  ui/
  theme/
  app-sdk/
  manifest/
  tooling/

examples/
  hello-app/
```

The repository uses npm workspaces and `go.work`.

Do not recreate old parallel root-level `frontend/` or `backend/`
architectures.

## Proven modular-app milestone

Containers has already been genuinely extracted from Core.

This is a runtime boundary, not only a directory move:
- Core does not import Moby for Containers business logic.
- Core does not compile-time import Containers React components.
- Containers backend is a separate native service.
- Containers backend runs through systemd and a private Unix HTTP socket.
- Browser requests go through Core at `/api/apps/{id}/...`.
- Core authenticates/authorizes and proxies to the application service.
- Containers frontend is independently built and lazy-loaded as a versioned
  Custom Element.
- Containers JavaScript is absent from the Core initial bundle.
- App Registry is persisted in PostgreSQL.
- The application can be installed and uninstalled without rebuilding Core.
- Core remains healthy when the application is absent or fails.

The end-to-end proof has already been exercised:
Containers absent -> install package -> systemd service/socket -> desktop icon
-> frontend load -> gateway API -> Docker lifecycle -> uninstall -> Core healthy.

Do not regress this boundary.

## Application platform contract

### App manifest

The platform uses a versioned YAML manifest with the `usecloud.io/v1`
contract. Go and TypeScript representations plus JSON Schema exist.

### Package format

Installable applications use the `.usecloud` package format. The current
package is a reproducible ZIP-based format with bounded extraction and
protections against traversal, symlink abuse and duplicate entries.

### App Registry

Desktop and Dock obtain installed applications through App Registry/API state,
not hardcoded application arrays.

### Backend services

A serious application can have its own backend process. The intended rule is
approximately one backend service per application when the application needs
backend business logic, not microservice-per-entity.

Native application services use private Unix HTTP sockets under systemd.

Do not introduce Kubernetes, a service mesh, or a local port zoo.

### Core gateway

Browser applications never connect directly to private application sockets.
They call the Core gateway:

```
App UI
  -> /api/apps/{appId}/...
  -> cloud-core
  -> authentication/authorization/registry checks
  -> private Unix socket
  -> application service
```

Do not allow an app to choose arbitrary upstream socket paths or upstream
credentials.

### Frontend application contract

Trusted first-party embedded applications use a Web Component / Custom Element
contract. Official applications can be implemented with React + TypeScript +
Vite internally, but the host boundary is framework-independent.

Do not introduce Module Federation as the primary application mechanism.

Web Components are not a security sandbox.

For genuinely untrusted web code, prefer external UI / separate origin, or a
sandboxed iframe only when embedding is required.

### Third-party applications

Mature third-party apps such as Jellyfin, Immich or Home Assistant do not need
to be visually rebuilt inside useCloudOS.

useCloudOS should install/manage/launch them and expose an appropriate URL,
preferably via a clean reverse-proxy host/subdomain strategy when available.

### Runtimes

The architecture anticipates:
- native applications;
- OCI/container applications;
- external/web applications.

Do not force all application types through one UI/runtime model.

## Public packages

The monorepo contains publishable/buildable packages intended to become an
external developer API.

### @usecloud/ui

Generic React UI primitives only.

Examples:
- Button/IconButton;
- StatusChip;
- Tabs;
- Dialog/Popover wrappers;
- Metric;
- Empty/Error/Loading states;
- generic Settings section primitives.

Do NOT move domain components such as ContainerRow, DockerStatus,
FileBreadcrumbs or BackupScheduleEditor into this package.

A component belongs in `@usecloud/ui` only when it is genuinely generic,
domain-independent and has a stable reusable interaction/visual semantic.

Do not create a generic `@usecloud/common` dumping ground.

### @usecloud/theme

Framework-independent semantic theme/token contract:
- Material color roles;
- `--uc-*` CSS custom properties;
- typography/shape/motion token definitions;
- theme helpers.

Applications should not hardcode product colors.

### @usecloud/app-sdk

Framework-independent host/platform integration contract.

React-specific bindings live in the React subpath/bindings, not in the core SDK.

The SDK is for platform concerns such as:
- app context;
- permissions;
- notifications;
- navigation;
- host capabilities/events.

Do not add domain APIs such as `host.files.rename()` to the generic SDK.

### @usecloud/manifest

Manifest schema/types/validation and related public contract.

### @usecloud/tooling

Package/application developer tooling.

### External developer requirement

An external developer must be able to build an app using published package
artifacts without importing private Core source. The Hello external consumer
has already been built from npm tarballs outside the monorepo as a proof.

## Shared-vs-private decision rule

When adding frontend code:

1. Shell-specific? -> `core/frontend`.
2. Domain/app-specific? -> owning `apps/<id>`.
3. Generic React UI primitive? -> `@usecloud/ui`.
4. Framework-independent theme contract? -> `@usecloud/theme`.
5. Platform/host integration? -> `@usecloud/app-sdk`.
6. Manifest/schema? -> `@usecloud/manifest`.
7. Uncertain or single-use abstraction? -> keep local.

Prefer proven reuse over speculative abstraction.

## Core database and application data

PostgreSQL is used for platform state such as:
- users/sessions foundation;
- platform settings;
- installed applications;
- app versions;
- grants/permissions;
- install/update state;
- jobs/notifications foundation.

Core PostgreSQL must not become the database for all applications.

Applications own their domain data. They may use their own database/storage
strategy where appropriate.

Uninstall should preserve application/user data by default unless the user
explicitly requests destructive removal.

## Security boundaries and known risks

The platform already distinguishes unsigned/signed/verified trust metadata,
but full signing/trust hardening is a current/next milestone if not yet merged.

Never fake cryptographic verification.

The Docker socket remains a documented high-privilege exception. Docker group
membership is effectively privileged; never treat it as a safe generic
capability and never use `chmod 777` on the socket.

Native/embedded app code is not automatically sandboxed.

Platform permission checks must be enforced server-side. Frontend checks are UX
only.

App package extraction must remain bounded and traversal-safe.

## Frontend technology and architecture

Core frontend stack:
- React;
- TypeScript;
- Vite;
- React Router;
- TanStack Query;
- Tailwind CSS;
- Material Color Utilities;
- Radix primitives where behavioral/accessibility primitives already exist;
- CVA, clsx, tailwind-merge;
- Storybook;
- Playwright;
- axe;
- Vitest / Testing Library.

Tailwind is the default styling mechanism. Prefer Tailwind + CVA + semantic
tokens over large custom stylesheets.

Feature-Sliced Design is used in large React frontends:

```
app -> pages -> widgets -> features -> entities -> shared
```

Keep pages thin and JSX readable.

Do not put cross-app shared library code in
`core/frontend/src/shared`; if Core and independently built apps require it,
it belongs in an appropriate public workspace package.

## Frozen visual direction

The previous `frontend-design` skill produced an unwanted
editorial/SaaS-dashboard direction and must not be applied to this repository.

The current design contract is stored in `docs/design/*` and is considered a
frozen baseline unless explicitly changed.

Visual identity:
- personal cloud OS, not a website/dashboard;
- end-4 / illogical-impulse inspired desktop-shell density;
- Material 3 / Material You semantic tonal system;
- wallpaper-backed desktop;
- top edge-to-edge OS System Bar;
- desktop widgets;
- desktop application icons;
- compact bottom Dock;
- Control Center;
- opened applications shown as large OS application surfaces with workspace
  padding around them;
- Core owns outer AppWindow/shell chrome;
- app owns its content.

Avoid:
- giant marketing H1s inside applications;
- generic SaaS/admin-dashboard composition;
- text-navbar docks;
- webpage-first shell layouts.

### Themes

Dark/light/system themes are supported. Light mode must be treated as a
first-class theme.

Use semantic theme roles, not hardcoded dark values.

Accent color selection uses a curated fixed palette. Do not use native
`<input type="color">` / OS color picker.

Wallpaper upload belongs to Settings. Wallpaper should be stored as Blob data
in IndexedDB rather than large base64 in localStorage.

### Typography

Use the centralized semantic typography scale. Roboto Flex is the UI typeface;
JetBrains Mono is for technical values/logs/IDs.

Dynamic strings such as hostnames, images, kernel versions and app names must
have explicit overflow behavior.

### Performance

Keep the shell energy-efficient:
- static wallpapers;
- no ambient animation loops;
- no WebGL/canvas visual effects for shell decoration;
- limited blur;
- reduced-transparency support;
- route/app lazy loading;
- installed app JS must not be bundled into clean Core boot.

Existing Core bundle budgets should not regress without a concrete reason.

## Current development environment

The project runs natively inside a Lima Debian VM.

Known Intel development environment:
- Debian GNU/Linux 13;
- x86_64;
- cloud kernel from Debian;
- Docker available;
- Core and Containers native services run inside Lima;
- Vite dev frontend is exposed through localhost;
- Vite proxy reaches real Core/Linux/Docker APIs.

The host currently used has Intel x86_64. Apple Silicon runtime has not been
executed on this host; ARM64 static/cross checks are expected instead.

Do not redesign the VM architecture casually.

## Current validation baseline

The modular migration previously reported:
- Go tests/race/vet passing for backend modules;
- amd64/arm64 static validation;
- PostgreSQL integration passing;
- frontend unit tests;
- TypeScript;
- ESLint/FSD/cycle checks;
- Prettier;
- production builds;
- Storybook;
- Playwright + axe;
- real browser integration;
- Lima Intel smoke;
- shell syntax and `git diff --check`.

A previous post-extraction bundle snapshot was approximately:
- Core initial JS: 140.9 KiB gzip;
- Core CSS: 10.1 KiB gzip;
- fonts: 73.0 KiB.

Treat exact numbers as historical reference, not permanent constants. Use the
repository's current documented budgets as authoritative.

## Near-term roadmap

After the successful Containers extraction, the next major direction is:
1. harden auth/session/permission enforcement;
2. implement real package signing/trust;
3. improve Store / Installed Apps UX;
4. create Files as the second serious installable app.

Files is intended to prove that the app platform works for a very different
domain: filesystem access, uploads/downloads, streaming, persistent user data
and filesystem security.

Do not jump directly to Photos/Backup/AI/remote marketplace before proving the
platform with the current milestone.

## GitHub repository

Canonical repository:

`https://github.com/iamfromhe1l/useCloudOS`

Default branch:

`main`

The repository already exists and contains the project baseline.

Never initialize another repository for normal project work.

Do not run `git init` as part of standard tasks.

## Required GitHub development workflow

Substantial changes must be developed through GitHub as normal feature work:

```
main
  -> feature/fix/refactor/docs branch
  -> logical commits
  -> push existing origin
  -> Pull Request to main
  -> review
  -> merge only after explicit user approval
```

### Branch naming

Use concise names such as:
- `feat/<feature>`
- `fix/<problem>`
- `refactor/<scope>`
- `docs/<scope>`
- `chore/<scope>`

### Commits

Prefer logical Conventional Commit-style commits, for example:

```
feat(files): add native files service
feat(security): verify app package signatures
fix(core): enforce revoked app permissions
test(files): cover path traversal
docs(apps): document Files runtime
```

Avoid both one meaningless mega-commit and artificial per-file micro-commits.

Do not commit knowingly broken intermediate states when avoidable.

### Pull requests

Each substantial milestone should end with a PR to `main` that explains:
- summary;
- changes;
- architecture impact;
- security impact;
- tests/validation;
- performance/bundle impact where relevant;
- documentation;
- intentionally deferred work.

Do not auto-merge the PR unless the user explicitly requests it.

Do not force-push or rewrite public `main` history.

### GitHub Actions

Reuse/improve existing CI. Portable checks belong in GitHub Actions where
reasonable. Lima-specific runtime validation can remain local and should be
reported separately.

### Secrets

Never commit:
- production credentials;
- session secrets;
- signing private keys;
- access tokens;
- real DB passwords;
- private certificates;
- user files/runtime state.

## Instructions for future ChatGPT/Codex sessions

When starting a new session about useCloudOS:

1. Treat this repository as canonical.
2. Read `AGENTS.md`.
3. Read this file.
4. Read the relevant authoritative docs for the task.
5. Inspect the current branch/PR state instead of assuming the last conversation
   equals repository state.
6. Preserve the frozen architecture/design contracts unless the user explicitly
   asks to change them.
7. For substantial implementation work, include the GitHub branch/commit/PR
   workflow in the task plan.
8. Do not initialize a new repository.
9. Do not merge PRs without explicit user approval.
10. Prefer implementing real vertical slices over speculative abstractions.

Repository state is more authoritative than conversational memory if they ever
conflict.
