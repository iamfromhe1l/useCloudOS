# Modular platform migration

Implementation sequence:

1. Audit instructions, source, build/test scripts and running Lima services.
2. Move Core into `core/`; establish npm and Go workspaces.
3. Extract narrow, publishable UI/theme/SDK/manifest contracts.
4. Implement persistent registry, permissions, package validation and installer.
5. Implement authenticated Core gateway and systemd application lifecycle.
6. Extract Containers backend and runtime-loaded frontend.
7. Integrate catalog/sideload, application management and developer tooling.
8. Exercise independent builds, package installation/removal, socket routing,
   visual/accessibility regressions and update architecture documentation.

Completion requires runtime proof, not directory layout alone. Core must remain
healthy with Containers absent or unavailable. Application assets are loaded
only when opened; removal must not require rebuilding Core.

## Verification evidence — 2026-10-17

On Intel macOS, native Debian amd64 Lima passed Linux/systemd/Docker/Go/data
checks; both AMD64 and ARM64 Lima configurations validated. Core ran as a native
systemd service with PostgreSQL 18 in the development VM.

The real package scenario passed: absent Containers → inspect unsigned package
→ install → independent systemd service/private socket → gateway requests →
Docker list/details/stats/logs/stop/start/restart → service failure isolation →
uninstall → registry removal → healthy Core. A browser integration test also
loaded the independently built Custom Element and confirmed desktop removal.
An additional restricted OCI package passed install/start/stop/start/uninstall.

PostgreSQL integration exercised isolated-schema migrations, registry persistence,
owner login and session revocation. Public npm tarballs built a standalone Hello
consumer outside the repository, including compiled semantic UI styles.

Full publisher PKI, generated ingress/TLS, durable crash recovery,
operation-level privileged brokering and complete account-management UX remain
explicit follow-up hardening, not silently claimed finished functionality.
Apple Silicon runtime execution was not available on this Intel host.
