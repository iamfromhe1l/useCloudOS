# ADR-006: Tailwind and semantic tokens

Status: accepted

## Context

Official apps must share UX without a generic dashboard kit.

## Decision

Tailwind-first generic UI with Radix behavior and inherited --uc-* Material roles.

## Consequences

Compiled package CSS works without guessing consumer content globs; custom CSS limited to justified integration/geometry.

## Alternatives considered

MUI templates, raw palette colors and global stylesheet dumping rejected.
