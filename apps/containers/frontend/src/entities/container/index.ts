import { useQuery } from '@tanstack/react-query'

import { request } from '@/shared/api'

import type { ContainerDetails, ContainerLogs, ContainersResponse, ContainerStats } from './types'
export { ContainerItem } from './ContainerItem'
export type * from './types'
export const containerKeys = {
  all: ['containers'] as const,
  detail: (id: string) => ['containers', id] as const,
  stats: (id: string) => ['containers', id, 'stats'] as const,
  logs: (id: string) => ['containers', id, 'logs'] as const,
}
const path = (id: string) => '/containers/' + encodeURIComponent(id)
export const useContainers = () =>
  useQuery({
    queryKey: containerKeys.all,
    queryFn: () => request<ContainersResponse>('/containers'),
  })
export const useContainer = (id: string) =>
  useQuery({
    queryKey: containerKeys.detail(id),
    queryFn: () => request<ContainerDetails>(path(id)),
    enabled: !!id,
  })
export const useContainerStats = (id: string, enabled = true) =>
  useQuery({
    queryKey: containerKeys.stats(id),
    queryFn: () => request<ContainerStats>(path(id) + '/stats'),
    enabled: !!id && enabled,
    refetchInterval: 10_000,
  })
export const useContainerLogs = (id: string, enabled = true) =>
  useQuery({
    queryKey: containerKeys.logs(id),
    queryFn: () => request<ContainerLogs>(path(id) + '/logs?tail=200'),
    enabled: !!id && enabled,
  })
export { containerStatusTone } from './state'
