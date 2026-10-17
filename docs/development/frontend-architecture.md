# Frontend architecture

One npm monorepo, separate build artifacts:

```text
core/frontend/src/{app,pages,widgets,features,entities,shared}
apps/containers/frontend/src/{app,pages,widgets,features,entities,shared}
packages/{ui,theme,app-sdk,manifest,tooling}
```

Inside each React codebase dependencies descend app → pages → widgets → features
→ entities → shared. Each business slice has index.ts, and @ resolves only that
frontend's src. Relative imports stay inside slices; pages compose widgets and
do not own fetch/lifecycle logic. ESLint rejects upward/peer/private imports,
Core↔app internals and public-package deep imports. Runtime graph checks reject
Core cycles. No compile-time import of Containers is allowed in Core.

Core pages are Home, Settings, Store, generic Application and fallback. Widgets
own shell geometry, SystemBar, Dock, desktop, Settings shell, Control Center and
AppHost. Core system/storage entities own platform queries. Application entity
maps persistent `/api/v1/apps` metadata into one launcher/window model.

Containers entities/features own Docker DTO/query keys and lifecycle mutations.
App content uses the public SDK gateway client, not Core shared/api. It has its
own QueryClient and memory router; route changes synchronize through HostContext.
Stats/log views mount only when selected. Moby code is in its separate backend.

Shared cross-artifact code belongs to public packages, never Core's shared folder.
@usecloud/ui contains generic visual/behavior primitives and compiled Tailwind
CSS. @usecloud/theme owns cached framework-independent Material roles and --uc-*
token contract. @usecloud/app-sdk is framework-neutral, with optional /react.
@usecloud/manifest owns versioned schema/types/validation. tooling cleans package
build outputs so private source/stale artifacts do not enter npm tarballs.

Core ThemeProvider owns mode/seed/transparency and wallpaper preferences. Apps
inherit variables into Shadow DOM, not HEX values or Core React Context.
Wallpaper Blob persistence/extraction/object URL cleanup remains a Core feature.
Radix portals in apps use the supplied Shadow portal container.

Tailwind is the default; CVA expresses variants. Semantic roles are mapped to
clean utilities. Custom CSS is limited to foundation, browser mask behavior and
justified frozen shell geometry. Existing app layout modules remain scoped during
this migration; do not create a parallel global stylesheet system.

Components use PascalCase, hooks useName, public APIs index.ts. Keep JSX readable,
pages thin and files around 50–150 lines; >250 nonblank lines fail lint warnings.
Root Prettier formats code/docs/YAML; strict TypeScript and noUncheckedIndexedAccess
remain enabled. ESLint 9/TS6 remain compatible with installed accessibility tooling.

Read docs/apps/frontend.md and docs/design/* before changing boundaries or UI.

Files follows the same application FSD contract. Its file-entry entity, file-browser
widget and create/upload/entry-actions features stay private to apps/files/frontend.
No file manager domain primitive was promoted to @usecloud/ui. Core only adds
generic trust, session and installed-app management UI. Manifest0.2.0 adds
capability-v2 risk metadata and signature metadata; SDK host contract remains v1.
Validate root format/lint/test/build, package tarball consumption, Storybook,
responsive Playwright/axe and real platform install/open/uninstall proof.

## Design System 2.0

UI/theme 0.2.0 retain host contract v1 and all runtime boundaries. The Store page
composes widgets/store; catalog cards/details own visual composition. Files
entry-actions owns one action model for Radix context/overflow and AlertDialog.
Public overlays use @usecloud/ui/overlays and Shadow PortalProvider. Import UI CSS
before consumer Tailwind to preserve responsive cascade. After changing public
exports, rebuild packages then restart Vite with --force; ordinary app development
still builds independent artifacts, never Core imports. Vite ignores test reports
and Storybook output to avoid QA-generated document reloads.

Opt-in real visual audit uses USECLOUD_DESIGN_REVIEW=1 and design-review.spec.ts;
USECLOUD_DESIGN_ROUND names local artifact folders. USECLOUD_REFRESH_FILES=1 is
explicit test-only reinstall with data retained; never use it to remove another
user's installation. See docs/design/audit-v2.md for the reviewed baseline/rounds.
