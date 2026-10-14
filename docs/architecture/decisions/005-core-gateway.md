# ADR-005: Core application gateway

Status: accepted

## Context

Browsers cannot reach private sockets or enforce real capabilities.

## Decision

All embedded app API traffic uses authenticated Core gateway and manifest permission routes.

## Consequences

Core knows routing policy but not business payload; upstream cookies stripped and trusted identity injected.

## Alternatives considered

Direct browser app ports and frontend-only permission checks rejected.
