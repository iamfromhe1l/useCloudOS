import { useQuery } from '@tanstack/react-query'
import type { AppManifest, TrustLevel } from '@usecloud/manifest'
import { useMemo } from 'react'

import { request } from '@/shared/api'
import { type IconName, isIconName } from '@/shared/ui'
export interface InstalledApplication {
  manifest: AppManifest
  status: string
  trust: TrustLevel
  digest: string
  grants: string[]
  installedAt: string
  updatedAt: string
  lastError?: string
  publisherKey?: string
  publisherName?: string
  publisherRevoked?: boolean
  packageBytes?: number
  effectivePermissions?: string[]
}
export interface Application {
  id: string
  name: string
  route?: string
  icon: IconName
  colorRole: 'primary' | 'secondary' | 'tertiary'
  availability: 'ready' | 'soon'
  dock: boolean
  desktop: boolean
  installed?: InstalledApplication
  iconURL?: string
}
interface RegistryResponse {
  applications: InstalledApplication[]
  systemApplications: Application[]
}
export const applicationKeys = { all: ['platform', 'applications'] } as const
export function useApplicationRegistry() {
  return useQuery({
    queryKey: applicationKeys.all,
    queryFn: () => request<RegistryResponse>('/api/v1/apps'),
    refetchInterval: 30_000,
  })
}
export function toApplication(app: InstalledApplication): Application {
  return { ...manifestIdentity(app.manifest), installed: app }
}
export function manifestIdentity(m: AppManifest): Application {
  return {
    id: m.metadata.id,
    name: m.metadata.name,
    route: '/apps/' + m.metadata.id,
    icon: isIconName(m.navigation.icon) ? m.navigation.icon : 'apps',
    colorRole: m.navigation.colorRole,
    availability: 'ready',
    dock: m.navigation.dock,
    desktop: m.navigation.desktop,
    iconURL: m.navigation.icon.startsWith('assets/')
      ? '/app-assets/' + m.metadata.id + '/' + m.metadata.version + '/' + m.navigation.icon
      : undefined,
  }
}
export function useApplications() {
  const query = useApplicationRegistry()
  return useMemo(
    () => [
      ...(query.data?.systemApplications ?? []).map((a) => ({
        ...a,
        availability: 'ready' as const,
      })),
      ...(query.data?.applications ?? []).map(toApplication),
    ],
    [query.data],
  )
}
export function useApplication(id: string) {
  return useApplications().find((app) => app.id === id)
}
export function useApplicationForPath(path: string): Application {
  return (
    useApplications().find(
      (app) =>
        app.route !== '/' && app.route && (path === app.route || path.startsWith(app.route + '/')),
    ) ?? {
      id: 'home',
      name: 'Home',
      route: '/',
      icon: 'home',
      colorRole: 'primary',
      availability: 'ready',
      desktop: false,
      dock: true,
    }
  )
}
