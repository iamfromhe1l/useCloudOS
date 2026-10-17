# Canonical components · 2.0

@usecloud/ui owns generic Button/PillButton, required-label IconButton, TextField,
Skeleton, Spinner, Progress, StatusChip, Tooltip, MetricWidget, TonalSurface,
InfoRow, SettingsSection, TerminalPanel and Empty/Error feedback.
PillButton remains an API-compatible historical name; ordinary buttons use
medium radius, not full pills. See packages/ui/README.md for API/use constraints.

@usecloud/ui/selection contains Radix Switch/ToggleGroup.
@usecloud/ui/overlays exports Radix Dialog, DropdownMenu, ContextMenu, AlertDialog and
Popover plus themed portal-aware MenuContent/ContextMenuContent/PopoverContent,
item/separator classes. This subpath stays lazy, outside initial shell code.
Radix owns focus, keyboard, positioning and dismissal; useCloudOS owns styling.
Use the same public overlay entry for composed menus/dialogs. Mixing direct
Radix imports with a separately bundled UI runtime can break sequential focus
and pointer-event restoration; real workflow tests cover this boundary.

Apps use PortalProvider so overlays stay inside the app Shadow DOM.
Import compiled UI CSS BEFORE the consumer Tailwind stylesheet; otherwise
generic utilities can override the consumer's responsive modifiers.

Static titles use OverflowText spans, full DOM text and title/tooltip, never
an inert button. Dynamic strings truncate, wrap or scroll intentionally.
Domain rows/menus stay private to Files/Containers. Shell AppWindow, Dock and
SystemBar stay Core-private. No premature shared abstraction.

Storybook is canonical: Foundations/Design System 2.0 includes actions, fields,
feedback, long values, object menus, popovers and destructive confirmation.
Theme toolbar reviews dark/light. Private shell/application stories are not
public UI APIs. See [interaction](interaction.md) and [feedback](loading-feedback.md).
