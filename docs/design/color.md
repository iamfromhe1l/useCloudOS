# Color

ThemeProvider generates Material SchemeTonalSpot roles from curated/wallpaper
seed, caches by version/seed/resolved mode and applies semantic --uc-* properties.
Applications never decide HEX colors or store independent dark modes.

Primary, secondary and tertiary each have on/container/on-container pairs.
Surface/dim/bright and container lowest/low/base/high/highest form elevation.
on-surface/variant, outline/variant and error/on-error/container pairs complete
the contract. Success/warning/info are harmonized, not arbitrary palette colors.

Primary anchors identity and action. Secondary expresses selection and calm
controls. Tertiary marks storage/discovery/notification surfaces. Do not tint
every surface primary. Always pair a container with its matching foreground.
Terminal is the documented specialized technical-surface exception.

Light, dark and system are equally supported. Accent swatches are the only
configured raw-color feature previews; use RadioGroup, never native color input.
