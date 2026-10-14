# Manifest v1

Canonical format is YAML: `apiVersion: usecloud.io/v1`, `kind: App`.
See `apps/containers/manifest/manifest.yaml` and `examples/hello-app/manifest.yaml`.

Metadata requires a unique lowercase slug, human name, SemVer and author.
IDs are at most 63 characters; home/settings/store/core are reserved. Platform
compatibility declares minVersion, optional maxVersion and hostVersion=1.

Runtime is native/container/external. Frontend is a web-component entry,
version-qualified custom element and stylesheet list, or an external URL.
Native backend declares executable, `<id>.sock` and explicit method/path
permission routes. Wildcards are trailing `/*`; undeclared paths/methods deny.
Navigation supplies one identity/icon/color role and desktop/dock eligibility.

Use `@usecloud/manifest` types and `parseManifest`/`validateManifest`; JSON Schema
is exported at `@usecloud/manifest/schema`. Core additionally checks platform
compatibility, package contents and safe install paths authoritatively.

Unknown fields, duplicate YAML keys, unknown/duplicate permissions, unsafe paths
and unsupported API versions are errors. Do not add arbitrary Docker options or
raw privileged access to this contract. Additive schema changes need explicit
compatibility documentation and both Go/TypeScript validation tests.
