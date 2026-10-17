# Authentication

Passwords use Argon2id: 64 MiB, 3 iterations, 4 lanes, random 16-byte salt and
32-byte output, PHC-style encoding with version and parameters. This follows the
memory-constrained profile in [RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html).
Comparison is constant-time. Bcrypt records remain readable and are rehashed
after a successful login. Hash parsing bounds work factors before allocation.

Single-node login protection permits 10 attempts per peer IP per 15 minutes,
with two concurrent KDF computations and a bounded 4096-peer table. Unknown users
also execute a dummy KDF. No Redis, forwarded-IP trust or credentials in logs.
Counters reset on process restart; proxy deployments must review shared-peer
rate limits before exposing the service. Per-account distributed abuse and MFA
are not claimed implemented.

First run requires CLOUD_CORE_BOOTSTRAP_PASSWORD when no owner exists. There is
no default password. Bootstrap never resets existing users. Development generates
an owner credential under /data/platform/config/owner-password (root-only), and
keeps the database credentials separately. To require login on an existing VM:

```bash
AUTH=required make backend-install
limactl shell usecloud-dev -- sudo cat /data/platform/config/owner-password
```

Read that credential yourself, then sign in as owner. Do not paste it in issues
or commit it. If an owner already had a different password, the generated file
does not override that password. Update the private development credential file
when changing the owner credential. AUTH=bypass is an explicit local development
exception; existing dev configuration is otherwise preserved.
