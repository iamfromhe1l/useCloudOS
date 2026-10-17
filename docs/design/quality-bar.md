# Production visual quality bar

Run the real application before editing. Capture Home, Files, Store, Settings,
Containers/details, Control Center and Login at compact/tablet/expanded and
dark/light. Review loading/empty/error, menus, long content and focus as well.

After implementation perform at least three serious browser review rounds:
capture → identify the five largest issues → fix → recapture. Record evidence
in audit-v2.md. Passing tests alone is not visual approval. Never regenerate
screenshots just to hide a regression.

Acceptance: obvious location/action/selection/running/pending/disabled states;
real Close/Back; no shell overlap/horizontal overflow; expressive generated
tones and deliberate shape; no fake controls. Responsive is composition, not
desktop scaled down. axe serious/critical = 0. Format/lint/FSD/cycles/typecheck,
unit/build/budget/Storybook/public tarball consumer and Playwright must pass.
