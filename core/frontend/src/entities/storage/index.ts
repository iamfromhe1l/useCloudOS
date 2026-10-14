import { useQuery } from '@tanstack/react-query'

import { request } from '@/shared/api'

import type { FilesystemsResponse } from './types'
export type { Filesystem, FilesystemsResponse } from './types'
export const useFilesystems = () =>
  useQuery({
    queryKey: ['storage', 'filesystems'],
    queryFn: () => request<FilesystemsResponse>('/api/v1/storage/filesystems'),
  })
