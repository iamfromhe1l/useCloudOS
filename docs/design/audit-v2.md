# Design System 2.0 audit

## Publication checkpoint

The owner requested publishing the current design work to main and retaining
`feat/design-system-v2` for further refinement/testing before the Backup milestone.
This is a development baseline, not a claim that all design acceptance work is
finished. The latest route synchronization fix passed four desktop/compact browser
regressions (Dock management and Containers Logs). Earlier review evidence below
is retained; rerun the complete visual matrix before final design sign-off.

Baseline: `d675d74`, Security/Files foundation; design branch is separate.
Real native Core/PostgreSQL/systemd apps, authenticated owner session, Vite shell.
Baseline captures: `artifacts/design-v2/baseline/{compact,medium,desktop}`.
390×844, 768×1024 and 1440×900; dark/light. Credentials and traces are excluded.
No user reference images were attached to this execution context.

## Findings before implementation

1. All widgets have the same outlined rounded frame and nested cards. Server
   identity is a narrow row, not a desktop anchor. CPU metrics are barely larger
   than labels; unused vertical space competes with actual information.
2. Window title chrome has no close action; Settings alone has a back affordance.
   Shape does not distinguish a window, action, menu and launcher.
3. System bar reads as one flat row. Dock active state is an outline around an
   already colored icon. Running and active are not distinct.
4. Files wastes toolbar space on a large sorting group and hidden-file switch.
   Every row says Actions. Selection is confined to the name, metadata is not
   column-aligned, and there is no right-click menu. Selection is not consistent
   across entry kinds. Async data transitions need explicit regression coverage.
5. Store leads with sideload and exposes version/runtime before app value. There
   is no search, featured content, product detail or installed Open action.
6. Settings has useful navigation but no personalization preview, large generic
   groups and too many identical pills. Compact navigation requires horizontal
   scroll. Keep its architecture while improving hierarchy.
7. Login is an ordinary form positioned by a large top margin, disconnected from
   wallpaper and device identity. Control Center includes nonfunctional controls
   and status masquerading as disabled buttons.
8. Containers repeats technical metadata and lifecycle controls in spacious cards.
   Detail overview is a wide undifferentiated definition list. Existing Radix
   detail tabs and lazy stats/logs are useful foundations to retain.
9. Semantic color roles already exist, including all requested surface levels.
   The issue is usage, not missing palette machinery. Preserve dynamic generation.
10. Initial async content can be caught before lazy routes/registry finish; visual
    captures must wait for actual content, not just the window heading.

## Direction and migration

Establish shared shape/spacing/type/feedback first; add lazy public overlay
primitives with Shadow DOM portals. Then shell/window/desktop, Files, Store,
Containers, Settings and auth. Preserve API/security/runtime boundaries.
Baseline Core: initial JS 141.2 KiB gzip, CSS 10.1 KiB, fonts 73.0 KiB.
Budgets remain 150/40/150 KiB. Review three real-browser rounds, record the five
largest issues each round, then approve responsive/light/dark snapshots.

## Reference study

[end-4](https://github.com/end-4/dots-hyprland) is a usability-first graphical
shell, with modular panels and wallpaper-generated Material themes. Its
[shell entry](https://github.com/end-4/dots-hyprland/blob/main/dots/.config/quickshell/ii/shell.qml)
separates panel families and lazy loading. Adopt independent utility hierarchy,
active-app identity and wallpaper integration, not its source, artwork, window
manager implementation or unrelated capabilities. No dependency is added.

## Visual QA rounds

All rounds used the actual authenticated Lima Core and installed native services,
not a static mockup. User/shared files were retained. Test screenshot fixtures
provide deterministic long-name/empty/loading/permission/installing coverage.

| Round | Five highest-priority findings                                                                                                                                       | Resolution                                                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Invalid 12-column area row; Files duplicate responsive metadata; too-dark list surface; duplicate catalog versions; hidden Settings rail icons                       | Equal named columns + geometry test; UI-before-Tailwind import; low tonal list; latest SemVer + reviewed digest; label-only hiding                                    |
| 2     | Mobile apps below widgets; Store CTA cramped against trust; Files toolbar wrapping unpredictably; menu-to-dialog focus loss; missing representative pending feedback | Launchers prioritized; explicit action spacing; deliberate toolbar breakpoints; synchronous Radix focus handoff + Cancel ref; skeleton/installing/refresh regressions |
| 3     | Extreme hostname overflow; modal semantics in Shadow Dialog; oversized compact detail hero; four-app mobile launcher density; date lacks full time                   | Bounded identity width; truthful aria-modal; compact detail variant; four-column compact launchers; semantic time + full localized tooltip                            |

Captures: artifacts/design-v2/{round-1,round-2,round-3,final}/viewport.
Round 3 includes 1920×1080 in addition to the initial three sizes, both themes,
real Files menus, Store details, Containers/details, Control Center and Login.
Final review follows the fixes and checks deterministic baselines separately.

Focus regression was not waived: the test asserts Cancel receives initial focus,
Escape returns to the action trigger, selection survives refresh and axe reports
no serious/critical issue with the modal open. A long-hostname test enforces
nonoverflow. Public-package rebuilds require restarting Vite after export changes;
test/report output is excluded from Vite watch to avoid QA-induced reloads.

No design assets were copied from end-4. No runtime shell dependency, animation
framework, fake app/data/progress or broad platform redesign was introduced.
