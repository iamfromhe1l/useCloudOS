# Foundations

## Material roles

The source seed feeds Material Color Utilities SchemeTonalSpot. Every role,
including the entire surface-container scale, is derived for dark and light.
Success, warning and info seeds are harmonized with the source. Components use
role pairs such as primary-container/on-primary-container; they never select
their own palette shades. The default family is moss/olive with warm neutrals
and a related teal tertiary.

ThemeProvider is the source of truth for mode, resolvedMode, seed,
wallpaperThemeEnabled and reduced transparency. CSS fallback roles for both
modes match the reviewed default seed. Generated roles are cached by version,
seed and resolved mode. System mode subscribes to OS color-scheme changes.
Colors are not recomputed on React renders.

Curated accent swatches are source seeds, not arbitrary component colors.
Their raw seed previews are the only feature-level visual color exception;
definitions live in shared/config/accentSeeds.ts. Selection uses RadioGroup.
There is no native color input or HEX editor. Turning wallpaper colors off
restores the last curated seed.

## Typography

Roboto Flex is the local UI font. JetBrains Mono is reserved for IDs, image
names, ports, kernel and logs. app/styles/typography.css centralizes full font
shorthands and tokens; tokens.css maps Tailwind semantic type aliases.

| Role         | Typical size | Use                            |
| ------------ | ------------ | ------------------------------ |
| Display      | 40 px        | Special system moments only    |
| Heading      | 24 px        | Exceptional contextual heading |
| Title large  | 19 px        | App title / primary metric     |
| Title medium | 16 px        | Container identity             |
| Title small  | 15 px        | Widget and group heading       |
| Body medium  | 15 px        | General content                |
| Body small   | 13 px        | Supporting content             |
| Label        | 13–14 px     | Controls / compact modules     |
| Caption      | 12 px        | Secondary shell label          |
| Mono         | 13–14 px     | Technical values               |

Do not invent text-xs/text-2xl hierarchies in features. Application screens do
not use display-sized titles. Dynamic strings must have an explicit wrap,
truncate or scroll policy; no grid child may expand a viewport.

## Shape, state and elevation

Small 10 px, medium 16 px, large 24 px, extra-large 28 px and pill radii are
canonical. Windows use extra-large; controls and selection use pills. Tonal
layers provide separation; shadows use semantic shadow tokens and restrained
opacity. Hover, selected, focus-visible, unavailable and pending states are
distinct. Inactive apps remain legible and say Soon/coming later.

Useful transitions last 120–180 ms and use opacity/transform. Reduced motion
removes movement. Forced colors retains borders and focus. No ambient loops.
