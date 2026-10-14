# ADR-004: Local Unix HTTP sockets

Status: accepted

## Context

All services run on one Linux node.

## Decision

Native app services expose private Unix sockets and GET /health under systemd.

## Consequences

Filesystem ownership replaces port sprawl; crash isolation remains process-level.

## Alternatives considered

Localhost TCP services and service discovery mesh are unnecessary.
