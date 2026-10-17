# Sessions and CSRF

Successful login creates a fresh random 256-bit opaque identifier. Only SHA-256
of the identifier is stored in PostgreSQL. A presented old session is revoked,
never adopted, preventing fixation. Every authenticated request checks user
enabled state, revocation, absolute expiry (24h) and inactivity (12h). Activity is
written at most every five minutes. Expired/revoked sessions never authorize.

Cookies: HttpOnly, Path=/, SameSite=Strict, 24h Max-Age/Expires, Secure by default.
HTTP development requires explicit CLOUD_CORE_DEV_HTTP=1 and SecureCookie=0.
Tokens are never placed in localStorage. All-session revocation is server-side.

- POST /api/v1/login, POST /api/v1/logout
- GET /api/v1/session, GET /api/v1/sessions
- DELETE /api/v1/sessions (all), ?others=1 (retain current)

Browser requests enforce same Origin host and reject cross-site Fetch Metadata;
Strict cookies are additional protection. Origin-less CLI clients may authenticate
with cookies; browser cross-site forms/fetch do not receive a permissive CORS
policy. A redundant frontend-only CSRF token would add no boundary here. This
model assumes trusted same-origin frontend code, correct TLS/host ingress and no
XSS. Web Components are therefore trusted code, not untrusted sandboxes.

Production requires CLOUD_CORE_ORIGIN=https://canonical-host at startup, and
checks both Host and browser Origin against it (including scheme). Preserve Host,
reject unwanted
hosts at ingress, and not enable wildcard credentialed CORS. The gateway strips
cookies and authorization headers before proxying to apps.

The local development admin helper caches a real cookie in root-only
/data/platform/config/admin-session.cookies. It is a credential, never an artifact.
