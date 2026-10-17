# Spacing and density

Use the Tailwind 4px base scale: 4/8/12/16/24/32px. Named --space-* aliases live
in theme tokens. Avoid arbitrary app-level pixel constants.

Shell modules: 4–8px gaps. Toolbars/rows: 8–12px gaps, 12–20px insets.
Settings: 16–24px grouped insets. Widgets: 24px inset, 16px grid gutters.
Store: 16px compact / 32px expanded content inset, bounded content width.

Primary actions/row targets are ≥44px. Efficient rows are 56px desktop and 64px
compact. App windows use shell geometry variables, not independent page margins.
