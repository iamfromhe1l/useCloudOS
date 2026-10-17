# Security boundaries

Core authenticates opaque, hashed, expiring sessions stored in PostgreSQL.
Passwords use versioned Argon2id, with bcrypt migration on login. HttpOnly/SameSite cookies, same-origin checks, bounded
request bodies and gateway permission routing form the current foundation.
Administrator capabilities and read-only ordinary-user policy are enforced
server-side. Frontend SDK checks are only UX hints.

Development has an explicit loopback-only bypass (`CLOUD_CORE_DEV_AUTH=1`),
restricted by both socket peer and Host/Origin. Never enable it on production.
Production requires TLS, Secure cookies, an owner bootstrap password and further
login rate limiting/recovery/session-management hardening before deployment.

ZIP validation rejects absolute/traversal paths, duplicate entries, symlinks,
unknown manifest fields, incompatible versions and oversized archives. Extraction
uses a new private staging directory and exclusive file creation. Binary package
paths and persistent data paths are distinct. IDs are safe slugs.

Trust levels are unsigned/signed/verified. Ed25519 verifies canonical package
contents; PostgreSQL publisher trust distinguishes signed from verified and
supports revocation. Production refuses untrusted native/embedded code. See
[implemented security contract](../security/README.md) for sessions, capability
revocation, signing format, developer keys and remaining deployment risks.

Web Components execute in the shell browser context. Shadow DOM is not a
security sandbox. Untrusted frontend code should use a separate origin/external
UI, or explicitly sandboxed iframe integration, not embedded host privileges.

Core temporarily runs as root to orchestrate systemd. Apps have dedicated
accounts, private runtime directories, NoNewPrivileges, PrivateTmp and restricted
writable paths. Containers receives Docker group membership only with granted
docker.manage. docker.read alone never grants socket group membership.
This grants root-equivalent daemon power, not read-only
isolation. Move privileged Docker operations to a capability broker/helper in a
future hardening step; do not give other apps this capability casually.

CSP must allow only same-origin trusted module assets, local fonts/styles/images
and required Blob wallpapers; never `script-src *` or unsafe-eval. Inline theme
styles and Shadow styles require a deliberate style policy/nonces. A strict
deployment CSP is deferred, not weakened silently by this migration.
