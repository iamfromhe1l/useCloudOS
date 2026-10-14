# @usecloud/manifest

React-free application contract types, permissions and validation.
Canonical YAML API: usecloud.io/v1. Host compatibility: v1. Package versions use
SemVer; app IDs use safe lowercase slugs and exclude reserved Core destinations.

parseManifest(yaml) and validateManifest(value) return a valid manifest or clear
validation errors. JSON Schema is exported as @usecloud/manifest/schema.
Runtime and frontend contracts are discriminated unions. PackageMetadata carries
manifest, digest and unsigned/signed/verified trust metadata, never fake verification.

Core Go validation remains authoritative for installed contents, platform
compatibility and extraction. Schema/Go/TypeScript changes need matching tests.
Consumers may validate without React or Core source access.

Build: npm run build -w @usecloud/manifest. Distribution contains dist, schema and
README, not application internals, tests or Storybook. npm pack is the publication
readiness check; no registry publication is automatic.
