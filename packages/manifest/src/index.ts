import { Ajv } from 'ajv'
import { parse } from 'yaml'

import schema from '../schema/app-v1.json' with { type: 'json' }
export const MANIFEST_API_VERSION = 'usecloud.io/v1' as const
export const PERMISSION_VERSION = 2 as const
export const permissionDescriptions = {
  'system.read': 'Read system information',
  'storage.app-data': 'Store application data',
  'storage.media.read': 'Read media',
  'storage.media.write': 'Write media',
  'storage.shared.read': 'Read files in shared storage',
  'storage.shared.write': 'Create, modify and permanently delete shared files',
  'network.lan': 'Access local network',
  'network.internet': 'Access Internet',
  'docker.read': 'Read Docker containers',
  'docker.manage': 'Manage Docker containers',
  'notifications.send': 'Send notifications',
  'background.run': 'Run in background',
} as const
export type Permission = keyof typeof permissionDescriptions
export const permissionMetadata = Object.fromEntries(
  Object.entries(permissionDescriptions).map(([id, title]) => [
    id,
    {
      id,
      title,
      description: title,
      risk:
        id === 'docker.manage'
          ? 'high'
          : id.endsWith('.write')
            ? 'high'
            : id.startsWith('storage.') || id.startsWith('docker.')
              ? 'medium'
              : 'low',
      category: id.split('.')[0],
    },
  ]),
) as Record<
  Permission,
  {
    id: Permission
    title: string
    description: string
    risk: 'low' | 'medium' | 'high'
    category: string
  }
>
export type AppRuntime =
  | { type: 'native' }
  | { type: 'container'; image: string; internalPort: number; command?: string[] }
  | { type: 'external' }
export type AppFrontend =
  | { type: 'web-component'; entry: string; element: string; styles?: string[] }
  | { type: 'external'; url: string }
export interface AppManifest {
  apiVersion: typeof MANIFEST_API_VERSION
  kind: 'App'
  metadata: { id: string; name: string; version: string; description: string; author: string }
  platform: { minVersion: string; maxVersion?: string; hostVersion: 1 }
  runtime: AppRuntime
  frontend?: AppFrontend
  backend?: {
    type: 'native'
    executable: string
    socket: string
    routes: { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; permission: Permission }[]
  }
  navigation: {
    desktop: boolean
    dock: boolean
    icon: string
    colorRole: 'primary' | 'secondary' | 'tertiary'
  }
  permissions: Permission[]
}
export type TrustLevel = 'verified' | 'signed' | 'unsigned'
export interface PackageMetadata {
  manifest: AppManifest
  trust: TrustLevel
  digest: string
  sizeBytes?: number
  signature?: {
    keyId: string
    publisherId: string
    publisherName: string
    algorithm: 'Ed25519'
    digest: string
    signature: string
  }
}
const validate = new Ajv({ allErrors: true }).compile<AppManifest>(schema)
export function validateManifest(
  value: unknown,
): { valid: true; manifest: AppManifest } | { valid: false; errors: string[] } {
  if (!validate(value))
    return {
      valid: false,
      errors: (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`),
    }
  const manifest = value
  const errors: string[] = []
  const safe = (value: string) =>
    /^[A-Za-z0-9_./-]+$/.test(value) &&
    !value.startsWith('/') &&
    !value.split('/').some((part) => part === '' || part === '.' || part === '..')
  if (
    manifest.frontend?.type === 'web-component' &&
    (!safe(manifest.frontend.entry) ||
      (manifest.frontend.styles ?? []).some((style) => !safe(style)))
  )
    errors.push('Unsafe frontend package path')
  if (manifest.backend && !safe(manifest.backend.executable))
    errors.push('Unsafe backend package path')
  if (['home', 'settings', 'store', 'core'].includes(manifest.metadata.id))
    errors.push('Reserved app id')
  if (manifest.backend) {
    if (manifest.runtime.type !== 'native') errors.push('Native backend requires native runtime')
    if (manifest.backend.socket !== manifest.metadata.id + '.sock')
      errors.push('Socket must match app id')
    for (const route of manifest.backend.routes)
      if (!manifest.permissions.includes(route.permission))
        errors.push('Route permission must be requested')
  }
  return errors.length ? { valid: false, errors } : { valid: true, manifest }
}
export function parseManifest(source: string) {
  if (source.length > 65536) throw new Error('Manifest exceeds 64 KiB')
  return validateManifest(parse(source, { uniqueKeys: true }))
}
