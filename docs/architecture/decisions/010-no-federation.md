# ADR-010: No Module Federation

Status: accepted

## Context

Installed apps must not share undocumented framework ABI.

## Decision

Self-contained app bundles and standard browser Custom Elements, not Module Federation.

## Consequences

Some runtime duplication is accepted in lazily loaded apps for independent lifecycle/version compatibility.

## Alternatives considered

Shared React globals and federation optimization would introduce premature release coupling.
