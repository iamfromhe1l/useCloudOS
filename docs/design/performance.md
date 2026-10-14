# Frontend performance and energy policy

The shell should remain visually quiet and computationally cheap on a machine
that is also running home-server workloads. Effects have a cost budget just as
JavaScript and fonts do.

## Enforced bundle budgets

`npm run build:budget` builds the production application, reads the Vite
manifest, and fails when any limit is exceeded:

| Resource                                          | Gzip/transfer budget |
| ------------------------------------------------- | -------------------: |
| Initial JavaScript, including static imports      |              150 KiB |
| Initial CSS                                       |               40 KiB |
| Largest required locale subset from both UI fonts |              150 KiB |
| Any individual JavaScript chunk                   |              200 KiB |

Routes, Control Center and the wallpaper selector are loaded with `React.lazy`. Material color generation is also an async
chunk, so it does not enlarge the first application script. A Rollup visualizer
report exposes dependency composition:

```bash
make frontend-budget
make frontend-analyze
```

The report is written to `frontend/dist/stats.html` and is not committed.

## Rendering and animation

- Prefer CSS layout and transitions over runtime measurement and JavaScript
  animation.
- Animate only transform and opacity where possible, for 120–180 ms.
- Do not add infinite animation, parallax, canvas particles, or animated
  backgrounds.
- Container stats and logs fetch only when their detail segment is open.
- Respect reduced motion, reduced transparency, and forced-colors preferences.
- Polling intervals and refetch behavior must reflect the freshness a screen
  actually needs; do not continuously animate or fetch hidden panels.

## Blur and layering

At most two blurred surfaces may be visible in the normal desktop shell: the
dock and one open utility panel. Compact mode should normally show only one.
Blur is capped at 12 px, never covers nested full-screen layers, and always has
an opaque fallback. Ordinary panels and settings windows use solid tonal
surfaces instead of blur.

## Fonts and icons

Roboto Flex and JetBrains Mono are local WOFF2 variable fonts split by unicode
range. Use JetBrains Mono only where its semantics justify the extra font. Do
not add remote font requests.

Material Symbols Rounded are imported as individual SVG modules and rendered
as current-color masks. Do not import the complete icon font or an entire icon
component registry. New icons must be named imports so unused assets remain out
of the build.

## Background images

The default wallpaper is a small local static SVG with a semantic fallback and
tonal overlay. User uploads are limited to 10 MB and 24 MP, normalized once to
a static WebP (long side ≤2560 px), and stored in IndexedDB. Animation frames
and oversized originals are not retained. Palette extraction samples 48×48
pixels once per selection/enabling. Blobs are replaced at one record key and
object URLs are revoked. Fit/seed changes reuse the current Blob URL.

The clock updates once a minute. SystemBar uses the existing resource Query key
and 10-second polling interval rather than an additional metrics request.
Theme palettes are bounded to 24 cache entries; failed optional cache writes
do not prevent theme generation.

The refactor retains all budgets. Initial JS growth is attributable to Radix
Toolbar/selection keyboard behavior and wallpaper persistence. Selection and
image-color code remain lazy; do not move them into the shared initial barrel.
Control Center is loaded on first use. Radix owns focus trapping and restoration
after loading; the initial launcher button only requests the utility chunk.

Measured baseline comparison using the same manifest budget script:

| Resource              |    Before |  Refactor |   Limit |
| --------------------- | --------: | --------: | ------: |
| Initial JS (gzip)     | 136.0 KiB | 144.3 KiB | 150 KiB |
| Initial CSS (gzip)    |  12.3 KiB |  10.6 KiB |  40 KiB |
| Required font subsets |  73.0 KiB |  73.0 KiB | 150 KiB |

No budget limit was increased. Storybook documentation/a11y tooling is a
separate developer build and is not shipped in the application.

## Growing lists

Container lists render normally while they remain small. At roughly 200 visible
rows—or earlier if profiling shows frame or memory pressure—introduce windowing
at the feature layer. Virtualization must preserve keyboard reachability,
accessible names, stable row identity, and a non-virtualized empty/error state.
Do not add a virtualization dependency pre-emptively.

## Measurement discipline

Before accepting a heavy dependency or visual effect:

1. inspect `dist/stats.html` and the budget result;
2. measure the affected route in a production build;
3. verify compact and reduced-motion behavior;
4. document any intentional budget increase with a concrete product reason.
