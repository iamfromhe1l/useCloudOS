# Design and FSD architecture

The design vocabulary and Feature-Sliced Design are one contract.
Read [frontend architecture](../development/frontend-architecture.md) for
implementation details.

app → pages → widgets → features → entities → shared

app composes peer shell widgets and installs providers/router. Pages are thin
route entry points. Widgets assemble domain data and actions. Features own
user interactions. Entities contain DTOs, queries, identity and presentation.
shared contains the network client, behavioral UI wrappers, theme
infrastructure, formats, fonts/assets and tokens.

Application chrome belongs to entities/application so any widget can use it
without importing another widget. The system bar accepts a Control Center
slot; app composes them. This keeps the same-layer import rule intact.

Every business slice has index.ts/index.tsx. External consumers use @ aliases
and public APIs. Relative imports stay inside a slice. ESLint rejects upward,
peer-slice and internal-path imports; a module-graph check rejects runtime
cycles. Shared infrastructure may expose named public submodules.

Tailwind is the default for generic primitives and new app content, with CVA
variants. Existing scoped shell geometry preserves the frozen baseline.
app/styles only holds fonts, semantic mappings,
fallback roles, typography, document base and shell geometry. UI primitive
CSS is owned by shared/ui, never the app global stylesheet.

Intentional design or architecture deviations require documentation in the same
change. Do not silently create a second shell, theme source, icon registry or
query client.
