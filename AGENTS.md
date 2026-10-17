# Repository instructions

## useCloudOS Architecture Contract

useCloudOS is a modular application platform. CORE PROVIDES THE PLATFORM;
APPS PROVIDE THE FEATURES. Read docs/architecture/* and docs/apps/* before
platform/application changes. Core stays a modular monolith in one cloud-core
process. Independently installable product domains belong in apps/, with one
backend service per application when needed, not one service per entity.

Before adding a capability: is it essential to boot/manage apps, users or the
system? Only then is it a Core candidate. Can it be independently installed or
removed, or does it own a business domain? It belongs to an app. Containers is
not a built-in Core feature. Never reintroduce its Docker business code or
compile-time React imports into Core.

Ownership decision tree:

- shell-specific UI → core/frontend;
- app/domain-specific code → owning apps/<id>;
- truly generic React interaction/visual primitive → @usecloud/ui;
- framework-independent theme contract → @usecloud/theme;
- platform integration/host contract → @usecloud/app-sdk;
- manifest/schema → @usecloud/manifest;
- uncertain, single-use abstraction → keep local.

Do not create @usecloud/common or a shared dumping ground. Promote an app
component only after real reuse and matching semantics; add tests, stories and
documentation. Public packages must build and npm-pack independently, expose
versioned exports, and never import Core/app private source.

Browser app requests go through the authenticated Core gateway. Native backend
services use private Unix HTTP sockets and systemd supervision. Web Components
are a trusted integration contract, NOT a security sandbox. Never label an
unverified package signed/verified. Native Docker access is a documented
temporary high-privilege capability; never chmod Docker sockets world-writable.
Core PostgreSQL owns platform state; app data is separate and retained by
default on uninstall. Package extraction must be bounded and traversal-safe.

One monorepo, npm workspaces and Go workspace; multiple independent artifacts.
Do not introduce Module Federation, Kubernetes, a service mesh or microservice
per entity. Mature third-party web UIs remain their own interfaces.

## Frontend visual work

Do not apply the globally installed `frontend-design` skill to this repository.
Its prior composition guidance produced an editorial/SaaS dashboard direction
that conflicts with useCloudOS.

The authoritative visual model is documented in `docs/design/` and is a
personal cloud operating environment: wallpaper-backed desktop workspace,
bounded application windows, Material tonal surfaces, compact launcher dock,
and utility/control-center layers. Avoid webpage-first composition, marketing
headlines, generic admin-dashboard cards, and text-navbar docks.

General engineering, accessibility, testing, and performance instructions
remain applicable.

## Frontend architecture

The frontend follows Feature-Sliced Design. All changes MUST respect:
app → pages → widgets → features → entities → shared.
Read docs/development/frontend-architecture.md before implementation.
Use slice public APIs and @ aliases. Lower layers and peer business slices
must not import higher/peer slices. Keep pages thin and JSX readable.

## Frozen design contract

Before ANY frontend UI change, read docs/design/*, beginning with README.md.
Design System 2.0 is the authoritative Material You OS identity. Never invent a
new visual language for each app. Visual UI work requires real browser screenshot
review in dark/light and responsive layouts; passing tests alone is insufficient.
Use the audit → implement → capture → review → fix loop, with evidence recorded
for major redesigns. Static titles are not actions; object menus need touch and
keyboard alternatives, and background refresh must preserve valid content.
useCloudOS is a personal cloud operating environment, not a web dashboard.
Reuse the canonical SystemBar, desktop grid/widgets, application registry,
AppWindow, Dock, Control Center and Settings controls.
Do not create SaaS layouts, marketing headers, generic dashboards or new shell
patterns without updating the design contract in the same change.

## Styling and components

Do not place component-specific styles in global CSS. Use semantic tokens,
Tailwind is the default styling mechanism; use CVA for variants. Custom CSS is
reserved for reset/fonts/tokens, rare shell geometry and integration behavior.
Existing scoped layout modules may be retained where needed to preserve the
frozen shell; do not grow a parallel component stylesheet system.
No hardcoded colors in features except configured accent-seed previews.
Typography follows the centralized semantic scale. Dynamic strings must wrap,
truncate with their full accessible value, or scroll without expanding layout.
Prefer stable accessible Radix primitives for dialogs, tabs, radio/toggle
groups, switches, tooltips, menus, selects and focus/keyboard behavior.
Compose menus/dialogs via @usecloud/ui/overlays so independently bundled Radix
copies do not create competing focus/layer runtimes within a consumer.
Do not introduce native color pickers, production mock data or animation loops.
Keep static wallpapers in IndexedDB as Blobs, never large localStorage base64.

## Security contract

Signed is not verified: cryptographic integrity and locally trusted publisher
identity are distinct. Revoked keys cannot install, update or start apps.
Never bypass the Core gateway or expose app sockets to browsers. Credentials,
session tokens and signing private keys never belong in frontend storage/logs.
Shared filesystem roots come from platform configuration and capabilities,
never arbitrary manifest paths; broad root access is not a default grant.
Preserve root-safe, no-symlink/no-mount-crossing operations and streaming.
Uploaded active content is attachment-only, never executable shell-origin UI.
Native app trust is not a sandbox. Docker manage remains root-equivalent.
Read docs/security/* for implemented policy and residual risks.

## Validation

Run frontend format check, ESLint/FSD/cycle checks, TypeScript, Vitest,
production build and bundle budget. UI changes also require reviewed
dark/light responsive Playwright snapshots, axe and Storybook build.
Any intentional architecture/design deviation MUST update the relevant docs
in the same change. Preserve system API and Lima workflow. App APIs use the
versioned gateway contract rather than legacy Core container endpoints.

## Persistent project context and GitHub workflow

For any substantial useCloudOS task, also read
`docs/ai/usecloudos-project-context.md` before implementation.

That file is the canonical cross-session project context for:

- current architecture and runtime boundaries;
- product/design direction;
- public package contracts;
- development environment and validation baseline;
- near-term roadmap;
- canonical GitHub repository;
- required branch/commit/PR workflow.

Repository state is more authoritative than conversational memory if they ever
conflict.

Substantial work must use the existing GitHub repository
`iamfromhe1l/useCloudOS` through a dedicated branch, logical commits, push,
and a Pull Request to `main`. Do not initialize a new repository and do not
merge a PR without explicit user approval.
