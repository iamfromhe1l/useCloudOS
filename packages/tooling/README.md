# @usecloud/tooling

Small developer-only package build runner. `usecloud-build-package` verifies a
useCloud package directory, cleans its generated dist, then emits TypeScript
JavaScript/declarations. It prevents stale source/test/chunk files entering npm
tarballs. It is not runtime business code or a generic helpers dumping ground.
React-to-Custom-Element integration lives in @usecloud/app-sdk/react instead.
