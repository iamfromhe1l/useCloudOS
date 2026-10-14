export interface Filesystem {
  mount_point: string
  filesystem: string
  total_bytes: number
  used_bytes: number
  available_bytes: number
  usage_percent: number
}

export interface FilesystemsResponse {
  filesystems: Filesystem[]
}
