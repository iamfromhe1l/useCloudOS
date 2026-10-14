# ADR-001: Monorepo

Status: accepted

## Context

Core, official apps and contracts need coordinated development without coupled release artifacts.

## Decision

One Git repository with npm workspaces and Go workspace.

## Consequences

Each app/package builds independently; no private-source imports across boundaries.

## Alternatives considered

Multiple repositories would add publishing overhead now; a single binary would erase installability.
