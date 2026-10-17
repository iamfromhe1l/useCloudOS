# ADR-014: Files native service isolation

Status: accepted

## Context

Filesystem operations need path safety under concurrent changes, not string-prefix checks.

## Decision

Dedicated non-root native service, private Unix HTTP socket and Linux openat2
no-symlink/no-cross-mount root resolution with fd-relative operations.

## Consequences

Linux5.6+ required; no unsafe fallback. Streaming transfers are bounded, overwrite
is opt-in only in future, and downloads cannot execute uploaded HTML in shell origin.
RestrictSUIDSGID cannot be combined with openat2; other systemd protections remain.

## Alternatives considered

Core file manager code, root service, EvalSymlinks-then-open and check-then-overwrite rejected.
