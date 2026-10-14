# Application architecture

`native`, `container`, and `external` are discriminated runtime types. Native
services and trusted embedded frontends work now; external launchers open their
original URL. The container manifest contract is reserved, and installation
reports unsupported execution until the OCI adapter is implemented.

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
