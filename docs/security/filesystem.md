# Shared filesystem boundary

Startup rejects broad, relative, specifier-bearing or overlapping package/data/
shared roots. Platform configuration is administrator-owned; do not point a shared
root at sensitive host directories. This prevents accidental ownership changes or
app-data purge targets from swallowing shared user storage.

Core selects CLOUD_CORE_SHARED_ROOT (default /data/shared), distinct from
/data/platform, PostgreSQL, package binaries and app-private data. The manifest
can request capabilities, never choose arbitrary host paths. Uninstall/purge of
Files app data never removes shared user storage.

Native apps get dedicated accounts. Shared root is root:usecloud-storage mode2770,
not recursively chmodded. Granted services receive a supplementary group and a
read-only/read-write systemd path according to their grant. Files runs non-root,
with NoNewPrivileges, empty capabilities, ProtectSystem=strict, ProtectHome,
PrivateTmp and AF_UNIX only. This remains trusted native code, not a full sandbox.

Files v1 uses openat2 RESOLVE_BENEATH|RESOLVE_NO_SYMLINKS|RESOLVE_NO_XDEV and
directory-relative operations. Symlinks are shown but never followed; deleting a
link removes the link. Nested mounts are not traversed. All destinations are
relative; root deletion, dot components, NUL, invalid UTF-8, encoded path markers
and reserved upload-temp names are rejected. Unicode ordinary names are supported.
Atomic renameat2 NOREPLACE prevents overwrite. Cross-filesystem move is rejected,
never silently implemented as copy/delete.

Uploads stream into same-directory exclusive temporary files, sync and publish
atomically without overwrite. Default limit2GiB (USECLOUD_MAX_UPLOAD_BYTES), at
most two uploads. Cancellation/error removes unpublished temp files. Downloads
stream as application/octet-stream attachment with escaped filename, nosniff and
sandbox CSP. Uploaded HTML/SVG never becomes executable app-assets content.

Directory output is paged (100 default, max500), server-sorted directories-first,
case-sensitive UTF-8 byte ordering, stable name tie-break. Dotfiles are hidden by
default; upload temporaries always hidden. A scan is capped at50000 entries; offset
paging is best-effort under concurrent directory mutation. No 100k DOM allocation.

RestrictSUIDSGID is intentionally disabled for shared-root services because
[systemd blocks openat2 with that directive](https://github.com/systemd/systemd/issues/38711).
NoNewPrivileges and capability removal remain. Startup probes openat2 and fails
closed if unavailable. Linux5.6+ is required. Privileged local mount changes,
hardlinks pre-created by trusted local actors, and a compromised native service
remain residual risks; this is not multi-user filesystem ACL isolation.
