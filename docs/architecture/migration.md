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
