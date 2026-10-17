# useCloudOS security foundation

Core authenticates people, authorizes platform actions, persists application
grants, verifies packages and controls service lifecycle. Apps own their domain.
These are distinct responsibilities, not a claim that every app is sandboxed.

Read [authentication](auth.md), [sessions](sessions.md), [permissions](permissions.md),
[signing](app-signing.md), [trust](trust.md), [filesystem](filesystem.md) and
[threat model](threat-model.md). Production still needs reviewed TLS/ingress,
credential recovery, deployment CSP and independent security assessment.
