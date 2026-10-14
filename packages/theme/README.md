# @usecloud/theme

Framework-independent Material You contract v1. Exports mode types, seed-based
cached role generation, apply/resolve helpers, shape/motion constants and CSS.

```ts
import { createThemeVariables, applyThemeVariables } from '@usecloud/theme'
```

CSS exports: @usecloud/theme/css (default dark/light roles), /tailwind (semantic
Tailwind theme mapping), /typography (type scale). Variables use --uc-primary,
--uc-on-primary, --uc-surface-container, --uc-on-surface, --uc-outline and other
Material/extended semantic roles. Applications must not know role HEX values.

Core alone owns ThemeProvider, wallpaper extraction and mode preferences. Apps
inherit the resulting variables across Shadow boundaries and get resolved mode
through HostContext. Static fallback roles, dark/light seed generation and
bounded cache are tested. Local UI fonts remain Core's loading responsibility;
standalone consumers may provide those fonts or use documented system fallbacks.

Build with npm run build -w @usecloud/theme; inspect npm pack before publication.
