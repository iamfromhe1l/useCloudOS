# ADR-012: Local publisher trust

Status: accepted

## Context

A valid signature does not imply an approved publisher.

## Decision

Separate unsigned, signed and verified. PostgreSQL stores local trust/revocation;
administrators explicitly trust fingerprints. Verified updates retain identity.

## Consequences

Revocation blocks package activation, gateway and assets and stops services.
Existing browser code still requires reload. No online PKI is claimed.

## Alternatives considered

Signature-presence badges and trusting every embedded public key were rejected.
