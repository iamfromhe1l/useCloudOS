# ADR-011: Ed25519 package signing

Status: accepted

## Context

Package parsing is not publisher authenticity. Archive serialization can change.

## Decision

Sign a versioned canonical file-digest representation using standard Ed25519.
Embed public identity and signature metadata, never private keys.

## Consequences

Byte changes invalidate signatures; compression metadata does not define identity.
Verification and extraction remain bounded. See docs/security/app-signing.md.

## Alternatives considered

Unsigned hashes do not prove authorship; raw arbitrary JSON or custom crypto was rejected.
