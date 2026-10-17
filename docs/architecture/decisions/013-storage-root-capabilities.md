# ADR-013: Shared storage root capabilities

Status: accepted

## Context

Files must not expose platform databases, credentials or the whole Linux root.

## Decision

Core config selects /data/shared. Storage capabilities grant read/write access;
apps never select arbitrary host paths in manifests. Shared files are not app data.

## Consequences

Uninstall/purge cannot delete user shared storage. Files has no Core domain tables.
Read revocation also revokes dependent write; grants reconfigure native services.

## Alternatives considered

Whole /data access, raw root paths in manifests and a premature S3 abstraction rejected.
