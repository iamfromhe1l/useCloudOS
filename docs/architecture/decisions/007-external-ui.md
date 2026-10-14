# ADR-007: External mature web interfaces

Status: accepted

## Context

Third-party applications already own complex mature UI.

## Decision

Preserve their original web UI; useCloudOS owns launcher/lifecycle metadata, preferably separate-origin/subdomain ingress.

## Consequences

No mandatory React integration or pixel restyling; path-prefix fallback needs app-specific compatibility.

## Alternatives considered

Rebuilding Jellyfin/Immich UI and universal iframe embedding rejected.
