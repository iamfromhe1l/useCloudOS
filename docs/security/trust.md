# Publisher trust

Startup reconciles installed executable apps with the current trust policy;
untrusted/revoked services are stopped, and activation/gateway/assets refuse them.
Do not promote a development disk to production with unreviewed enabled units:
local root can always bypass the manager, and systemd boot ordering is not a
malicious-native-code sandbox. Review installed packages before deployment.

Unsigned: no signature. Signed: Ed25519 verification passed, publisher key not
trusted locally. Verified: signature passed AND publisher ID/name/key matches an
unrevoked locally trusted record. A parsed archive or present signature is never
enough for a verified badge.

PostgreSQL publisher_keys stores fingerprint, public key, identity, trust source,
created/revoked timestamps. Trust/revocation is an administrator operation and
audited. Revocation denies future install/update/start and app gateway/assets;
the manager stops affected services. A revoked key cannot simply be re-trusted.
Existing executing trusted browser code cannot be forcibly erased from a page;
reload after revocation. Requests still lose authorization immediately.

Unsigned/unknown-key native or embedded code requires explicit development policy.
Do not enable that policy on a production platform. Containers/Files development
packages are signed with a generated local key, never a committed private key.
An installed verified app cannot silently change signing identity or downgrade.

Audit events store timestamp, actor, action, target, result and safe metadata.
Login success/failure/logout, session revocation, app install/update/uninstall,
grant/revoke, publisher trust/revoke and failed privileged app requests are
recorded. Tokens, passwords, private keys, file contents and filenames are not
audit payloads. Audit retention/export and tamper-evident remote storage are
future operational work, not a SIEM implemented here.
