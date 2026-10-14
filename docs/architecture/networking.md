# Local application networking

Browser → Core `/api/apps/<id>/<path>` → authenticated principal → installed
registry entry → declared method/path permission → granted capability → Unix
HTTP socket → application service.

Sockets live at `/run/usecloud/apps/<id>/<id>.sock`, in private systemd runtime
directories owned by the application account. Core derives paths from validated
IDs, never accepts an arbitrary upstream URL/socket from a browser. Cookie and
Authorization headers are removed upstream; trusted user identity is set by Core.

App assets use `/app-assets/<id>/<version>/frontend/...`, load only on open, and
cache privately/immutably. Every release uses a version-qualified Custom Element
name so an already-registered old implementation cannot mask an update.

Lima's existing localhost:8080 forwarding remains unchanged. Vite proxies both
`/api` and `/app-assets` to Core; there are no additional app TCP ports.

Mature external UIs should use their own origin, ideally generated subdomains.
Arbitrary path-prefix rewriting is not a universal reverse-proxy solution.
Host-based ingress/TLS/DNS provisioning is deferred; explicit external URLs work
now and are not restyled or injected into Core React.
