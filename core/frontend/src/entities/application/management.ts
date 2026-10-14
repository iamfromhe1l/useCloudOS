import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PackageMetadata } from '@usecloud/manifest'

import { request } from '@/shared/api'

import { applicationKeys } from './registry'
export function useCatalog() {
  return useQuery({
    queryKey: ['platform', 'catalog'],
    queryFn: () => request<{ applications: PackageMetadata[]; source: string }>('/api/v1/catalog'),
  })
}
export function useAppMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ path, method, body }: { path: string; method: string; body?: BodyInit }) =>
      request<unknown>(path, { method, body }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}
export function inspectPackage(file: File) {
  return request<PackageMetadata>('/api/v1/apps/inspect', { method: 'POST', body: file })
}
