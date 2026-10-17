# Application architecture

`native`, `container`, and `external` are discriminated runtime types. Native services and trusted embedded frontends work now; external launchers open their original URL. The OCI adapter installs and starts platform-owned containers with a restricted Engine API configuration.

Frontend-only and backend-only native apps are valid. A serious backend is one
separate service for the application's domain. It is not compiled into Core.

First-party UI uses a versioned Custom Element host contract, not Module
Federation or shared React Context. Each app artifact can bundle its own React
runtime. Core updates must not require recompiling all installed applications.

Jellyfin, Immich and Home Assistant should keep their mature UI. useCloudOS is
their installer/launcher/lifecycle platform, not a replacement React frontend.
External origin/subdomain ingress is preferable to fragile path-prefix rewriting.

Core's AppWindow surrounds app content. Never recreate the SystemBar, Dock,
wallpaper or login inside an embedded first-party application.

The initial OCI runtime deliberately supports a narrow configuration: image,
optional command, platform-owned labels, no Linux capabilities, no privileged
mode, and optional app-data mounted only at /data. Networking defaults to none;
bridge requires both LAN and Internet grants because separate egress isolation
is not implemented. It never mounts Docker sockets or arbitrary host paths.
Port publishing, environment configuration, generated ingress and richer health
policy remain future schema/runtime extensions. External UI URLs are explicit,
not a claim that automatic subdomain/TLS provisioning exists already.
