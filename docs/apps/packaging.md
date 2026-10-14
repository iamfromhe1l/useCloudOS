# `.usecloud` packages

A package is a conventional ZIP, not a proprietary binary archive:

```text
manifest.yaml
frontend/   # entry module, chunks and compiled CSS
backend/    # optional native executable
assets/     # optional icon/assets
metadata/
signature/  # reserved; signatures are not currently accepted
```

Limits: 128 MiB compressed, 256 MiB expanded, 2048 entries and 64 KiB manifest.
No absolute paths, traversal, duplicate entries, backslashes, symlinks or special
files. Exclusive staging extraction prevents overwriting existing files.
Archive modes are ignored; only the declared backend executable is executable.

CLI validates manifests and all referenced entry/style/backend files. Pack sorts
entries and fixes timestamps/modes for reproducibility. Sideload first inspects,
shows metadata/permissions/trust, and only installs after explicit confirmation.

```bash
go run ./core/backend/cmd/usecloud app validate path/manifest.yaml
go run ./core/backend/cmd/usecloud app inspect artifacts/app.usecloud
go run ./core/backend/cmd/usecloud app pack staging artifacts/app.usecloud
```

Trust remains unsigned until real signature verification exists. Signature
metadata is rejected, never converted into a fake verified badge. Core's explicit
development policy can allow unsigned native/embedded packages; production cannot.

Uninstall keeps persistent data by default. Update uses a distinct SemVer,
new staged artifact, stop/start/health check and rollback foundation. Application
data migration hooks and crash recovery are not silently simulated.
