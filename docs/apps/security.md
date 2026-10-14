# Application security

Web Components and Shadow DOM are not a security sandbox. Trusted embedded code
runs in the shell origin and can execute browser APIs. An untrusted application
should keep an external UI on a separate origin, with optional sandboxed iframe
only when explicitly required. There is no default iframe runtime.

Browser traffic goes through Core authentication/authorization and the gateway.
Applications never receive the user's session cookie upstream. Service sockets
are private filesystem endpoints; a manifest cannot redirect Core to an arbitrary
socket or URL. Native app accounts are not root.

## Docker socket security

`/var/run/docker.sock` controls a root-capable daemon. The Containers service
needs it to implement the existing Docker domain. Its dedicated account receives
Docker group membership only after capability approval; there is no chmod 777.
Do not expose this socket to frontend code or arbitrary apps. Only the limited
Containers API is browser-accessible, through Core's permission gate.

This direct socket grant is a temporary privileged exception. Production
least-privilege hardening should introduce a broker/helper with operation-level
capabilities. A manifest grant is not a kernel-enforced sandbox by itself.

See [platform security](../architecture/security.md) for auth development mode,
trust policy, signing/CSP foundations and deployment restrictions.
