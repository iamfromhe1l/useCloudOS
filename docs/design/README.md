# useCloudOS Design Contract

STATUS: FROZEN BASELINE — DESIGN SYSTEM 2.0

useCloudOS is a personal cloud operating environment, not a web dashboard.

Material You Expressive + desktop OS interaction + end-4 inspired shell composition

- calm personal cloud simplicity. This identity is authoritative for Core and
  official applications. Do not invent a new style per app.

Before ANY frontend UI change: read docs/design/*, starting here.
The architecture remains frozen; DS 2.0 changes visual composition and interaction,
not platform boundaries.

## Authoritative contract

- [Foundations](foundations.md): density and design vocabulary.
- [Color](color.md), [shape](shape.md), [spacing](spacing.md),
  [typography](typography.md), [motion](motion.md).
- [Shell](shell.md), [windows](windows.md), [Home](home.md).
- [Components](components.md), [interaction](interaction.md),
  [loading and feedback](loading-feedback.md).
- [Files](files.md), [Store](store.md), [responsive](responsive.md).
- [Architecture](architecture.md), [performance](performance.md),
  [quality bar](quality-bar.md), [audit and review evidence](audit-v2.md).

## Application UI integration

Core owns wallpaper, desktop, SystemBar, Dock, utility layers and outer AppWindow.
An application owns content. Trusted Custom Elements inherit --uc-* tokens into
Shadow DOM; they never recreate shell chrome or import Core private source.
Official apps use @usecloud/ui; domain UI stays in its owning app.

No generic SaaS layouts, page-wide marketing headers, text-navbar docks,
functional emoji, native color pickers or pretend controls. A title is not an
action. Right-click always has a keyboard/touch-accessible alternative.
UI work requires reviewed real-browser screenshots, not only passing tests.
