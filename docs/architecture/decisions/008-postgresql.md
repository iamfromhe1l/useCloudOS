# ADR-008: Platform PostgreSQL ownership

Status: accepted

## Context

Registry/auth need persistent transactional platform state.

## Decision

Core PostgreSQL stores platform state only; applications own business data separately.

## Consequences

Native Core uses pgx and embedded migrations; dev PostgreSQL runs in Lima Docker with persistent /data volume.

## Alternatives considered

One universal app database creates lifecycle coupling; in-memory production registry loses installs.
