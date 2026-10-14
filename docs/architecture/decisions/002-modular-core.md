# ADR-002: Modular Core and installable apps

Status: accepted

## Context

A personal cloud should keep platform lifecycle stable while features expand.

## Decision

Minimal modular-monolith Core; independently installed app domains, one service per substantial app.

## Consequences

Containers is optional and removable without Core rebuild; no microservice-per-entity zoo.

## Alternatives considered

A feature monolith and enterprise microservice split both violate ownership.
