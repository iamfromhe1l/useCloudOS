import { useMutation, useQueryClient } from '@tanstack/react-query'

import { type ContainerAction, containerKeys } from '@/entities/container'
import { engineKeys } from '@/entities/engine'
import { request } from '@/shared/api'
export function useContainerAction(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (action: ContainerAction) =>
      request<void>('/containers/' + encodeURIComponent(id) + '/' + action, {
        method: 'POST',
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: containerKeys.all }),
        client.invalidateQueries({ queryKey: engineKeys.info }),
      ])
    },
  })
}
