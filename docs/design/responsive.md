# Responsive shell contract

Design System 2.0: Compact Home puts application launchers before the widget
stack so opening an app does not require scrolling past system data. Files uses
mobile name/size rows and a full-width filter above its action row; expanded
toolbar aligns path, filter and actions horizontally. Store stacks discovery,
featured and catalog surfaces; detail is a focused view with Back. Settings keeps
its responsive rail; icon labels hide on Medium without hiding the icons.

| Mode     | Width       | Transformation                                                              |
| -------- | ----------- | --------------------------------------------------------------------------- |
| Compact  | <600 px     | Simplified bar, single-column widgets, fullscreen app below bar, bottom nav |
| Medium   | 600–839 px  | Two-column desktop, near-full app, icon Settings rail, centered dock        |
| Expanded | 840–1439 px | Twelve-column desktop, maximized bounded app, labelled Settings rail        |
| Large    | ≥1440 px    | Same system, increased workspace inset, window max-width 1664 px            |

Every mode retains wallpaper, system bar and dock. A route change replaces the
desktop content with one application, rather than displaying desktop icons
through the application or beside it.

The system bar keeps launcher/current app, clock and Control Center on Compact.
CPU/RAM/Docker modules hide according to priority before horizontal overflow.
The clock updates at most once a minute. Resource modules share the existing
10-second Query key with desktop widgets.

Application height is derived from root shell variables. Window content scrolls
internally; final buttons and logs never sit under dock. Compact removes fake
floating margins and radii while preserving bar/dock offsets.

Settings adapts its Tabs orientation and rail to layout: horizontal on Compact,
vertical otherwise. Controls wrap into stacked rows as needed. Accent seeds
use four columns below Expanded and six on larger windows. Wallpaper preview
fits its pane.

Control Center is a bounded upper-right dialog on wider screens and a bottom
sheet on Compact. Touch targets, Escape behavior and focus trapping persist.

Regression viewports: 390×844, 768×1024, 1440×900, 1920×1080. Tests cover dark
Home, Containers, Details, Settings, Control Center; light Home, Containers,
Settings, Control Center; plus long values, upload/persistence/removal,
system-mode changes, selection and keyboard dock. Baselines are reviewed
visually before final acceptance, not simply regenerated to hide failures.
