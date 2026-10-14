# ADR-003: Web Components

Status: accepted

## Context

Frontend runtime coupling must survive Core framework updates.

## Decision

Versioned Custom Element host contract, Shadow DOM styling isolation, private app runtime.

## Consequences

Apps load on open, inherit theme variables, and need version-qualified tags for updates. This is not a security sandbox.

## Alternatives considered

Compile-time React imports, primary iframe embedding and framework-specific context coupling rejected.
