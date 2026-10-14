import { useQuery } from '@tanstack/react-query'

import { request } from '@/shared/api'
export const engineKeys = { info: ['engine', 'info'] } as const
export interface EngineInfo {
  available: boolean
  server_version?: string
  api_version?: string
  containers?: number
  containers_running?: number
  containers_stopped?: number
  images?: number
}
export const useEngineInfo = () =>
  useQuery({ queryKey: engineKeys.info, queryFn: () => request<EngineInfo>('/docker/info') })
