# Local single-node threat model

| Threat                         | Implemented mitigation                                                      | Residual risk                                                             |
| ------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Malicious/tampered package     | bounded ZIP, canonical Ed25519 verification, trust policy                   | trusted native code can misuse its OS rights                              |
| Unsigned frontend              | refused outside explicit dev policy                                         | Web Component is NOT a sandbox                                            |
| Stolen publisher key           | local revocation, stop apps, deny gateway/assets                            | already executing browser code needs reload; no online revocation network |
| Traversal/symlink/mount escape | openat2 and fd-relative operations, no-follow/no-xdev                       | privileged local administrators remain trusted                            |
| Session theft/fixation         | Secure/HttpOnly/Strict cookies, hashed tokens, expiry/revoke/fresh login ID | TLS, XSS prevention and host security remain required                     |
| CSRF                           | same-origin and Fetch Metadata checks, Strict cookies, no permissive CORS   | same-origin malicious code already has browser privileges                 |
| Capability escalation          | declared route + grant + role checks, trusted socket derivation             | kernel confinement is not identical to capability UX                      |
| Docker access                  | explicit docker.manage, dedicated service, no chmod777                      | socket is root-equivalent                                                 |
| Active uploads                 | attachment/octet-stream/nosniff/sandbox, not app assets                     | previews intentionally absent                                             |
| Gateway bypass                 | private Unix socket directories, no app TCP endpoint                        | local root or compromised owning service can bypass its own UI            |

CSP audit: trusted installed modules need same-origin script loading, no unsafe-eval.
Current Vite is a development server, not production ingress. Deployment must
serve Core under a reviewed CSP. Dynamic theme variables and Shadow style tags
need nonces/hashes or a deliberate style-src exception; do not relax script-src.
There is no claim that a strict production CSP is enforced by Vite. Downloads
already enforce their own sandbox policy.
