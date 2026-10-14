export interface SystemInfo {
  hostname: string
  os: {
    name: string
    version: string
  }
  kernel: {
    release: string
    architecture: string
  }
  uptime_seconds: number
}

export interface SystemResources {
  cpu: {
    logical_cores: number
    usage_percent: number
  }
  memory: {
    total_bytes: number
    available_bytes: number
    used_bytes: number
    usage_percent: number
  }
}
