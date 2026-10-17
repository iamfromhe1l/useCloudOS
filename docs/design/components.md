# Canonical components

## Foundations and controls

@usecloud/ui contains PillButton (CVA), StatusChip, Tooltip, TonalSurface, InfoRow,
MetricWidget, QuickSettingTile, TerminalPanel and async feedback states.
@usecloud/ui/selection is the public API for Radix ToggleGroup-based
SegmentedControl and Switch; it stays out of the initial shell chunk.

Radix owns Dialog focus trapping, Tabs selection/keyboard behavior, RadioGroup
accent navigation, ToggleGroup mode/fit/filter behavior, Switch semantics,
Tooltip positioning and Toolbar dock navigation. Native buttons and links
remain appropriate for ordinary actions and navigation. Never hand-code these
behavioral primitives.

## Domain identity and windows

entities/application owns AppIcon, AppWindow and WindowTitleBar because they
combine application identity with chrome. They depend only on shared UI and
the registry-derived application model. ContainerItem belongs privately to the
Containers app, with lifecycle features composed inside that application.

## Widgets and features

SystemBar is decomposed into SystemBarSection, SystemBarItem, SystemMetric and
SystemClock. The Control Center trigger is passed as a slot by app/shell, so
peer widgets do not import each other.

DesktopWidget defines header/content/footer. Resource, Storage, Applications, System
and Server widgets each own one domain query and presentation. DesktopGrid
composes named slots; DesktopApplications reads the registry.

Core features own platform actions: application installation, theme switching,
accent selection, wallpaper persistence and Control Center toggle.
Container filtering/lifecycle remain in the installable Containers app.
Pages compose widgets; they do not fetch or embed lifecycle state.

## Accessibility and overflow

Every interactive control has a semantic role, accessible name and visible
focus. Dialog closes via Escape and restores focus. Selection controls support
keyboard navigation. Truncated names retain full DOM text and show full values
through tooltips; supporting kernel/IDs/technical rows wrap anywhere. Logs have
their own bidirectional scroll area. All grid/flex children use min-width: 0.

Controls are at least 44 px where they are primary touch targets. The system
bar has deliberately compact shell controls. The wallpaper file input is
visually hidden and invoked by a labelled real button.

## Storybook

Foundations, Shell, Desktop, Applications, Navigation, Controls, Feedback and
Data display contain the production components. Review both themes and all
four viewport categories. Fixtures are confined to tests/stories; production
always uses cloud-core.
