import { useQuery } from '@tanstack/react-query'

import { api } from '@/shared/api'
export interface FileEntry {
  name: string
  path: string
  kind: 'file' | 'directory' | 'symlink'
  size: number
  modifiedAt: string
}
export interface StorageRoot {
  name: string
  writable: boolean
  availableBytes: number
  totalBytes: number
  maxUploadBytes: number
}
export const fileKeys = { all: ['files'] as const }
export function useStorageRoot() {
  return useQuery({
    queryKey: [...fileKeys.all, 'root'],
    queryFn: () => api.request<StorageRoot>('/root'),
  })
}
export function useEntries(path: string, sort: string, hidden: boolean, offset: number) {
  const params = new URLSearchParams({
    path,
    sort,
    hidden: hidden ? '1' : '0',
    offset: String(offset),
    limit: '100',
  })
  return useQuery({
    queryKey: [...fileKeys.all, 'entries', path, sort, hidden, offset],
    queryFn: () =>
      api.request<{ entries: FileEntry[]; total: number; offset: number; limit: number }>(
        '/entries?' + params,
      ),
  })
}
export function formatBytes(n: number) {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n === 0) return '0 B'
  const index = Math.min(Math.floor(Math.log(n) / Math.log(1024)), 4)
  return `${(n / 1024 ** index).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${['B', 'KiB', 'MiB', 'GiB', 'TiB'][index]}`
}
export { FileIcon } from './FileIcon'
