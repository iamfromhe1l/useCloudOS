# useCloudOS Design Contract

STATUS: FROZEN BASELINE

useCloudOS is a personal cloud operating environment, not a web dashboard.

Visual direction: Material You + end-4 inspired desktop shell + personal cloud simplicity.
Before ANY frontend UI change: read docs/design/*.

This contract covers the desktop, system bar, application workspace, launcher
identity, utility panels and preference controls. It is the authoritative
baseline, not a suggestion to apply a generic dashboard template.

## Application UI Integration

Core owns desktop, SystemBar, Dock, wallpaper and outer application-window chrome.
An installed app owns CONTENT, loaded independently through its Custom Element.
Official React apps use @usecloud/ui and inherit @usecloud/theme --uc-* tokens.
They must not recreate the shell or import Core private UI. Domain components
stay in their owning app; generic primitives live in public packages.

Read [foundations](foundations.md), [shell](shell.md), [components](components.md),
[responsive rules](responsive.md), [performance](performance.md) and
[architecture](architecture.md). [System](system.md) is the overview entry point.

Changes must reuse canonical components and semantic roles. An intentional
deviation requires a contract update in the same change, including responsive,
accessibility and bundle evidence. Never add marketing headings, a website
navbar, a separate icon vocabulary or component CSS to global styles.
