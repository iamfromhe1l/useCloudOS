import { useQuery } from '@tanstack/react-query'

import { request } from '@/shared/api'

import type { SystemInfo, SystemResources } from './types'
export type { SystemInfo, SystemResources } from './types'
export const systemKeys = {
  info: ['system', 'info'],
  resources: ['system', 'resources'],
} as const
export const useSystemInfo = () =>
  useQuery({ queryKey: systemKeys.info, queryFn: () => request<SystemInfo>('/api/v1/system/info') })
export const useSystemResources = () =>
  useQuery({
    queryKey: systemKeys.resources,
    queryFn: () => request<SystemResources>('/api/v1/system/resources'),
    refetchInterval: 10_000,
  })
