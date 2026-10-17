# Capability registry v2

OCI permission changes stop/remove/recreate the platform-owned container so old
mounts/network grants cannot survive a restart. Persistent app-data is retained;
ephemeral container filesystem changes are not persistent application data.

Runtime-type or backend-presence changes require explicit uninstall/reinstall
with data retention; an in-place update cannot leave an old enabled native unit
behind when switching execution models. Same-runtime signed releases use the
normal health-check/rollback pipeline.

Authentication identifies a user. Authorization applies role policy. Application
grants bound app API capabilities. All three are required: hiding a button is not
security. Admins manage apps/trust/grants; standard users currently have read-only
platform/app access. Per-user writable sharing/ACL editing is deferred.

The manifest requests permissions; installation confirmation grants them. Requests
are human-labelled with risk/category metadata in @usecloud/manifest. Risk is UX,
not enforcement. The server checks declared method/path, persisted grant, role,
installed state, key revocation and a derived private socket target.

storage.shared.read/write describe platform storage, not a Files screen. Write
requires read. Revoking read also removes write. Revocation is persisted before
runtime reconfiguration; gateway denial is immediate. Native services restart
to remove supplementary groups/read-write mounts. If supervision fails, the UI
reports recovery required rather than silently restoring a grant.

Updates require explicit consent. New requests are shown before approval;
previously revoked requests stay revoked. Publisher changes and verified→unsigned
or unknown-key downgrades are rejected; reinstall is a deliberate separate action.

Docker manage grants root-equivalent daemon access. Docker read alone does not
grant Docker group membership. Network family limits are not LAN-only firewalling;
media capabilities remain reserved until a matching resource broker exists.
