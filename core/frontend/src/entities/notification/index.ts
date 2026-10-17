import { useQuery } from '@tanstack/react-query'

import { request } from '@/shared/api'
export const notificationKeys = { all: ['platform', 'notifications'] } as const
export interface Notification {
  id: number
  appId: string
  message: string
  createdAt: string
}
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => request<{ notifications: Notification[] }>('/api/v1/notifications'),
  })
}
