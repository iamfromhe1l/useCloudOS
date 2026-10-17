# `.usecloud` packages

`usecloud app build <app-directory>` validates the manifest and builds an optional
frontend and native Go backend independently. Native source follows
`backend/cmd/<executable-name>`; output is `dist/<executable-name>` and targets
Linux (set GOARCH for a different Linux host). Frontend-only templates may keep
package.json at their root. Build never silently installs or grants permissions.
Stage outputs under the canonical paths below before `app pack`.

A package is a conventional ZIP, not a proprietary binary archive:

```text
manifest.yaml
frontend/   # entry module, chunks and compiled CSS
backend/    # optional native executable
assets/     # optional icon/assets
metadata/
signature/  # signature.json: canonical Ed25519 signature
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

Trust is calculated by Ed25519 verification and the platform publisher store.
Invalid signatures are rejected; valid unknown publishers are signed, not verified.
Core's explicit development policy can allow untrusted native/embedded packages;
production requires verified publisher trust. See [signing](../security/app-signing.md).

Uninstall keeps persistent data by default. Update uses a distinct SemVer,
new staged artifact, stop/start/health check and rollback foundation. Application
data migration hooks and crash recovery are not silently simulated.
