# Application window

Core owns static icon/title and a real required-label Close IconButton. Close
returns Home. Do not show fake minimize/maximize controls or make title clickable.
Apps own content and internal domain navigation, not a second outer window.

Window width ≤1664px, available workspace height. Geometry derives from
--system-bar-height, --dock-height, --dock-bottom, --workspace-inline,
--workspace-top-gap and --workspace-bottom-gap. Wallpaper margin remains visible.
The bottom edge always precedes Dock; internal content owns scrolling.

Compact is effectively fullscreen below SystemBar, above bottom navigation.
Files propagates bounded height through AppHost/custom root to pin its footer
without scrolling user content under shell controls.
