# Personal cloud shell · 2.0

Wallpaper → desktop or application workspace → SystemBar/Dock → utility/popover
→ modal confirmation. Apps never draw the bar, wallpaper or Dock.

SystemBar touches the viewport top. Left: overview launcher and static active-app
identity. Right: grouped real CPU/RAM module, installed-app state, minute clock
and Control Center trigger. CPU/RAM opens a lazy, bounded resource popover sharing
the existing query. No fabricated network/power/media state.

Dock uses the same registry-derived AppIcon as desktop/window chrome.
Active destination has a secondary tonal capsule and elongated indicator;
running services have a dot independently of the active route. Hover lifts 3px,
press scales subtly; reduced motion removes both. Radix Toolbar provides
arrow/Home/End navigation, Tooltip names and aria-current identify destinations.
Compact turns into labelled bottom navigation. It never covers content.
An explicit Application actions button and right-click share a lazy Radix menu
anchored to the Dock. Open, Close view and installed-app management are real;
Close never implies stopping a backend service. Management opens Settings Apps
directly. Keyboard End reaches this final action, not the last app destination.

Control Center is a bounded upper-right Dialog / compact bottom sheet.
Device status, working Theme/Settings actions, real application/storage status
and notifications have distinct tonal hierarchy. Unsupported network/backup
pseudo-controls are removed, not disguised as disabled working features.

Wallpaper remains static and locally persisted as an IndexedDB Blob, normalized
once. Wallpaper-derived seed generation and all existing validation/caching/
object-URL cleanup are preserved. See [color](color.md) and [windows](windows.md).
