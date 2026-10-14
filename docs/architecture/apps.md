# Application boundaries

An application owns its business domain and may have frontend, backend or both.
One substantial application approximately equals one backend service.

Native apps: independently built executable supervised by systemd, Unix HTTP
socket and optional trusted Custom Element frontend.
External apps: registered launcher into their original mature web UI.
Container apps: versioned manifest runtime model reserved for an OCI installer;
execution is explicitly reported unavailable until that adapter is implemented.
It never silently reports a container runtime as successfully started.

Core owns the outer AppWindow; embedded apps own its content. Shadow DOM scopes
CSS, while semantic `--uc-*` variables inherit from the shell. This is styling
isolation, not arbitrary-code sandboxing.

Containers owns its Docker service and UI. Generic UI belongs to narrow public
packages only after genuine semantic reuse. See [developer docs](../apps/README.md).
