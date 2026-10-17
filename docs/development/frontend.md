# Frontend development

The shell now lives in `core/frontend`; Containers is an independently built app
in `apps/containers/frontend`. Install from the root npm lockfile/workspaces with
`make frontend-install`, then `make dev` for the full platform workflow.
Read [application development](../apps/development.md) and
[frontend architecture](frontend-architecture.md). Vite proxies `/api` and
`/app-assets`; application bundles are runtime-loaded, not imported into Core.

The frontend is a React shell for the real `cloud-core` API. Production code
contains no mock API: system and Docker data come from the Linux VM, while test
fixtures intercept network requests only inside component or browser tests.

## Stack and structure

- React, TypeScript, Vite, React Router, and TanStack Query;
- Tailwind CSS mapped to runtime CSS variables;
- Material Color Utilities for seed-derived tonal roles;
- Radix Dialog, Tabs, RadioGroup, ToggleGroup, Toolbar, Tooltip and Switch;
- CVA, `clsx`, and `tailwind-merge` for typed visual variants;
- Vitest and React Testing Library;
- Storybook with Docs and a11y;
- Playwright with axe checks and screenshot regression;
- Rollup Visualizer plus an enforced bundle budget.

```text
core/frontend/
├── .storybook/             component workbench configuration
├── stories/                design-system and shell stories
├── tests/                  Playwright visual/accessibility checks
├── scripts/                bundle-budget enforcement
└── src/
    ├── app/                providers, router, shell composition, foundation CSS
    ├── pages/              thin lazy route entry points
    ├── widgets/            desktop, system bar, dock, control center, app views
    ├── features/           user interactions, theme choices, wallpaper storage
    ├── entities/           DTOs, queries, system/application identity
    └── shared/             base API client, UI wrappers, theme, helpers, assets
```

Read the [frontend architecture](frontend-architecture.md) before implementing changes.
The frozen visual contract is documented in [Design Contract](../design/README.md),
[responsive rules](../design/responsive.md), and
[performance policy](../design/performance.md).

## Requirements and installation

Frontend tooling runs on the macOS host. Use Node.js 22.22.2+ or 24.15+ on a
supported even release line (Node.js 24 is recommended):

```bash
make frontend-install
```

Dependencies and font assets are pinned by `package-lock.json`.

## Development workflow

Use `make dev` to build/register Containers and start the complete workflow. For separate Core debugging, run the backend in Lima in one terminal (stop its systemd service first if already running):

```bash
make vm-start
make backend-run
```

Run Vite on macOS in another terminal:

```bash
make frontend-dev
```

Open <http://localhost:5173>. The routes are:

- `/` — wallpaper-backed Home workspace with live widgets and launchers;
- `/apps/containers` — Docker application window and lifecycle controls;
- `/apps/containers/:id` — segmented Overview, Stats, Ports, and Logs view;
- `/store` — local catalog and package sideload;
- `/settings` — maximized system Settings window;
- any unknown route — themed fallback screen.

The two long-running processes intentionally remain separate so their output
and Ctrl-C lifecycle stay explicit.

## API connection and Vite proxy

The client uses relative `/api/v1/...` URLs by default. Vite proxies `/api` to
`http://127.0.0.1:8080`, the existing Lima port forward to `cloud-core`:

```text
macOS browser :5173
        │ /api/v1/...
        ▼
Vite development proxy
        │ http://127.0.0.1:8080
        ▼
Lima port forward → cloud-core in the guest
```

This avoids a permissive backend CORS policy. Override only when required:

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:9090 make frontend-dev
```

`VITE_API_BASE_URL` configures the common native-fetch client. Leaving it empty
uses same-origin URLs and the development proxy. An absolute URL bypasses the
proxy and requires that origin to provide an appropriate CORS policy.

## Theme development

The first frame has reviewed roles for both light and dark. ThemeProvider
applies cached SchemeTonalSpot roles for Dark, Light or System. Appearance offers
11 curated seeds, optional wallpaper colors, upload/preview, Fill/Fit, removal,
default reset and reduced transparency. Wallpapers are stored as static Blobs
in IndexedDB; only small preferences and cached palettes use localStorage.

Use semantic token classes instead of fixed colors. Review primitives and shell
patterns independently with:

```bash
make frontend-storybook
make frontend-storybook-build
```

Storybook is available at <http://localhost:6006>. Its a11y addon treats
violations as errors. In Storybook 10, the former essentials preset is part of
the core/addon set; Docs and a11y are configured explicitly.

## Tests, visual checks, and production build

```bash
make frontend-test
make frontend-format-check
make frontend-lint
make frontend-check
make frontend-build
make frontend-budget
make frontend-visual-test
```

Unit/component tests cover formatting, dashboard isolation, Docker-unavailable
behavior, container rendering, lifecycle pending state, and API errors.
Playwright covers four responsive modes and runs serious/critical axe checks on
Home, Containers, Container Details, Settings, and Control Center before
comparing their screenshots.
Light-theme snapshots, very long values, wallpaper upload/reload/removal,
accent keyboard selection, system-mode updates and dock keyboard navigation
are also checked.

Playwright starts its own Vite server and mocks network only in the test
process. Install its Chromium runtime once if a fresh machine does not have it:

```bash
cd core/frontend
npx playwright install chromium
```

To inspect bundle composition or deliberately refresh reviewed visual
baselines:

```bash
make frontend-analyze
cd frontend && npm run visual:update
```

The production build is emitted to `core/frontend/dist`. A future deployment must
serve that directory and route `/api` to the backend; Vite's proxy is only for
development.
