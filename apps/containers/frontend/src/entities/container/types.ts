export interface ContainerSummary {
  id: string
  name: string
  image: string
  state: string
  status: string
  created_at: string
}

export interface ContainersResponse {
  containers: ContainerSummary[]
}

export interface ContainerPort {
  container_port: number
  host_port: number
  protocol: string
}

export interface ContainerDetails {
  id: string
  name: string
  image: string
  state: string
  created_at: string
  started_at: string
  restart_count: number
  ports: ContainerPort[]
}

export interface ContainerStats {
  cpu_percent: number
  memory: {
    used_bytes: number
    limit_bytes: number
    usage_percent: number
  }
  network: {
    rx_bytes: number
    tx_bytes: number
  }
  block_io: {
    read_bytes: number
    write_bytes: number
  }
}

export interface ContainerLogs {
  logs: string
  truncated: boolean
}

export type ContainerAction = 'start' | 'stop' | 'restart'
