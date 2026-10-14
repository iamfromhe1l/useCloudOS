import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { parseManifest, validateManifest } from './index'
describe('manifest contract', () => {
  it('validates independent Containers and Hello manifests', () => {
    for (const file of [
      '../../../apps/containers/manifest/manifest.yaml',
      '../../../examples/hello-app/manifest.yaml',
    ])
      expect(parseManifest(readFileSync(new URL(file, import.meta.url), 'utf8')).valid).toBe(true)
  })
  it('rejects unsafe ids, unknown permissions and fields', () => {
    expect(validateManifest({ apiVersion: 'invalid' }).valid).toBe(false)
    const source = readFileSync(
      new URL('../../../examples/hello-app/manifest.yaml', import.meta.url),
      'utf8',
    )
    for (const changed of [
      source.replace('id: hello', 'id: ../hello'),
      source.replace('permissions: []', 'permissions: [root.shell]'),
      source + '\nunknown: true',
    ])
      expect(parseManifest(changed).valid).toBe(false)
  })
})
