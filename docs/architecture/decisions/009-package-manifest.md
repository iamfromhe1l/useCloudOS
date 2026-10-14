# ADR-009: Versioned application packages

Status: accepted

## Context

Installation must validate paths, permissions, metadata and compatibility.

## Decision

YAML usecloud.io/v1 manifest and bounded reproducible ZIP .usecloud packages.

## Consequences

Staged exclusive extraction rejects links/traversal/duplicates. Unsigned trust is explicit; signatures are not faked.

## Alternatives considered

Custom binary archives and README-only manifests rejected.
