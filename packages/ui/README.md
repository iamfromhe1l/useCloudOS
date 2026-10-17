# @usecloud/ui

Generic React visual/interaction primitives for useCloudOS applications.
This package knows no application domain, Core registry, query or shell chrome.
React/ReactDOM are peer dependencies; an independently built app bundles its
own compatible runtime once, never imports Core's React internals.

```tsx
import { PillButton, TonalSurface, StatusChip } from '@usecloud/ui'
import { Switch, SegmentedControl } from '@usecloud/ui/selection'
import '@usecloud/ui/css'
```

## Design System 2.0 (0.2.0)

`Button` aliases the compatible historical `PillButton`; ordinary action shape is
16px, not rounded-full. `IconButton` requires `label` and `icon` plus native button
props. Use it for real icon actions, never static window identity. React 19 refs
are forwarded as props for Radix composition and focus restoration.

| Public primitive | API                              | Use / not use                                         | Accessibility / story                                         |
| ---------------- | -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Skeleton         | div props/className              | Initial absence only; not background refresh          | Decorative; parent live status; Foundations/Design System 2.0 |
| Spinner          | label/className                  | Action pending only; not idle decoration              | Named status, reduced motion; overview                        |
| Progress         | value/label                      | Measured 0–100 work; not invented install percentages | Bounded progressbar; overview                                 |
| TextField        | label + native input props       | Simple text/search/auth fields; no domain fetch       | Generated input id and labelled focus; overview               |
| IconButton       | label/icon + native button props | 44px named action; not fake window controls           | Native button; overview                                       |

`@usecloud/ui/overlays` exports Radix namespaces Dialog, DropdownMenu, ContextMenu,
AlertDialog and Popover. Themed MenuContent, ContextMenuContent and PopoverContent
portal into PortalProvider's container. menuItemClass/menuSeparatorClass style
the corresponding Radix children. This keeps behavior stable and heavy overlays
out of initial shell imports. ObjectMenus and Popups stories document keyboard,
disabled and destructive states. Do not put domain action decisions in this API.
Do not mix direct Radix Dialog imports with these bundled overlays in one
consumer; sharing the public entry keeps focus/layer coordination consistent.

Import compiled UI CSS **before** your own Tailwind import so consumer responsive
utilities remain authoritative. Shadow apps must provide PortalProvider; CSS
variables inherit from Core. Overlay content needs an accessible heading/label
where appropriate. AlertDialog requires Title, Description and safe Cancel.

All stories use the dark/light toolbar. Review long content, keyboard focus,
disabled/pending and destructive variants; semantic tokens remain mandatory.

Compiled CSS is shipped with the package, so consumers do not guess Tailwind
content globs. Tailwind consumers may also import @usecloud/theme/tailwind for
their own semantic utilities. Core supplies inherited --uc-* theme variables.
No arbitrary palette colors or app/network logic belongs in a primitive.

| Public primitive         | API and appropriate use                                        | Not appropriate for                           |
| ------------------------ | -------------------------------------------------------------- | --------------------------------------------- |
| PillButton               | Native button props, tone, icon, iconOnly; labelled actions    | Navigation divs/business mutations            |
| Icon                     | Known Material Rounded name, className; decorative mask        | Unsafe SVG markup                             |
| StatusChip               | tone, children; concise semantic state                         | Domain state computation                      |
| Tooltip                  | label, one focusable child; Radix positioning/keyboard         | Essential information available only on hover |
| SegmentedControl         | label/value/options/onChange; Radix single selection           | Arbitrary manual keyboard radio behavior      |
| Switch                   | label/checked/onCheckedChange/disabled; Radix switch           | App settings persistence                      |
| TonalSurface             | HTML div props, className; interior grouping                   | Recreating AppWindow/Desktop                  |
| SettingsSection          | title/description/children; generic preference group           | Core navigation ownership                     |
| InfoRow                  | label/value/mono; definition-list data row                     | API querying                                  |
| MetricWidget             | label/value/detail/progress/tone; bounded numeric presentation | Resource polling/stat calculations            |
| QuickSettingTile         | icon/label/detail/active/disabled/onClick; compact action      | Unimplemented controls pretending to work     |
| TerminalPanel            | pre attributes/className; scrollable technical text            | Streaming/log transport                       |
| OverflowText             | text; truncation and full accessible tooltip value             | Hiding essential long form content            |
| Loading/Error/EmptyState | message/title/action slots; textual feedback                   | Swallowing errors silently                    |
| RetryAction              | onRetry; labelled ordinary action                              | Automatic uncontrolled retry loops            |
| PortalProvider           | container; route Radix portals into Shadow DOM                 | Security isolation                            |
| cn                       | class composition/merge                                        | Runtime Tailwind palette construction         |

Controls use semantic tokens, visible focus, real buttons and Radix behavior.
Primary touch targets are at least 44 px; reduced motion is respected.
Public stories live in packages/ui/stories and the main Design System Storybook.
Core-private shell stories are a separate review category; domain stories stay
with their app.

Promotion policy: fundamental primitive, or second real reuse → compare semantics
→ extract only if genuinely generic → public API + tests + story + docs. Do not
extract ContainerRow, DockerStatus or FileBreadcrumbs into this package.

Build: `npm run build -w @usecloud/ui`. Check distribution: `npm pack --dry-run`.
The package is not published; licensing/publication must be approved by the owner.
