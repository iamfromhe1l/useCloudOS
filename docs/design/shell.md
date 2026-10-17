# Personal cloud shell

## Layer and geometry contract

Static wallpaper → desktop → application workspace → system bar / dock →
Control Center / dialogs. Desktop widgets and icons are only rendered on Home;
an open application shows wallpaper around its boundary, never widgets behind
its contents.

The edge-to-edge system bar touches the viewport top. Its fixed height is
--system-bar-height. Left: Home launcher, current application and optional
useCloudOS identity. Right: shared CPU/RAM queries, installed-app state, minute clock
and right-most Control Center trigger. Network is not fabricated.

Workspace geometry uses only these root variables:

- --system-bar-height
- --dock-height
- --dock-bottom
- --workspace-inline
- --workspace-top-gap
- --workspace-bottom-gap
- --workspace-height (derived)

AppWindow occupies the available workspace, up to 1664 px wide. It is a
maximized application surface with margins, not a small floating card. The
window owns title chrome and an internal scroll region. Home also scrolls
inside the workspace rather than behind the fixed dock. Its lower edge always
ends above dock height + inset + gap. Browser tests enforce this invariant.

## Desktop

DesktopGrid has named areas and one consistent gutter. Expanded uses 12
columns: server full row, resources 8/storage 4, applications 5/system 7. Medium uses
logical two-column areas; Compact stacks. Text cannot decide column widths.
Each widget shares DesktopWidget/WidgetHeader/WidgetContent/WidgetFooter.

Desktop applications are individual launcher targets on the wallpaper, with
the same AppIcon used by Dock and WindowTitleBar. There is no Applications card.
Single click/tap opens a ready application; future applications show Soon and
have no route.

## Application identity and dock

The persistent Core App Registry supplies installed applications. The frontend
entities/application model maps that metadata to id, name, route, icon,
colorRole, availability, dock and desktop. Dock never defines independent
destinations. Its active app has a tonal capsule and an open dot; unavailable
apps remain legible. Radix Toolbar manages arrow/Home/End navigation and Radix
Tooltip provides names. aria-current identifies the route. Compact shows labels.

## Control Center and Settings

Control Center is a Radix Dialog at the upper-right on desktop and a sheet on
Compact. Real status is separate from quick actions. Installed apps have a status tile;
Theme is actionable; Network and Backup explicitly say Coming later.
There is no fake notifications feed.

Settings uses the same workspace window geometry. Its navigation is Radix Tabs:
left rail on Expanded, icon rail Medium, horizontal stacked selector Compact.
Appearance contains mode, curated accent, wallpaper colors, upload/preview,
Fill/Fit, Remove, Reset default and reduced transparency. Other unavailable
sections say Coming later.

## Wallpaper

Default moss ridges is a static local SVG. User images are validated (raster
MIME, 10 MB, 24 MP), decoded on change and normalized to a static WebP with long
side at most 2560 px. One Blob record plus fit/name/extracted seed is stored in
IndexedDB. Large base64 strings never enter localStorage. Replacing/removing
the record releases the old Blob reference; object URLs are revoked on change
and unmount. The fallback is a semantic tonal background.

Use wallpaper colors runs a 48×48 representative-color extraction only on
upload/enabling, using Material QuantizerCelebi and Score. The seed is cached
in the record and applied through ThemeProvider. Failed extraction preserves
the current accent and reports a recoverable error. No runtime decoding loop.
