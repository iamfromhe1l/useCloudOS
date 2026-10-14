import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { jsonResponse, renderPage } from '@/shared/test/render'

import { DashboardPage } from './DashboardPage'

afterEach(() => vi.unstubAllGlobals())

function dashboardFetch(registryAvailable = true) {
  return vi.fn((input: RequestInfo | URL) => {
    const path = String(input)
    if (path.endsWith('/system/info')) {
      return jsonResponse({
        hostname: 'usecloud-dev',
        os: { name: 'Debian GNU/Linux', version: '13' },
        kernel: { release: '6.12', architecture: 'aarch64' },
        uptime_seconds: 13_320,
      })
    }
    if (path.endsWith('/system/resources')) {
      return jsonResponse({
        cpu: { logical_cores: 4, usage_percent: 12.4 },
        memory: {
          total_bytes: 8 * 1024 ** 3,
          available_bytes: 5 * 1024 ** 3,
          used_bytes: 3 * 1024 ** 3,
          usage_percent: 37.5,
        },
      })
    }
    if (path.endsWith('/storage/filesystems')) {
      return jsonResponse({
        filesystems: [
          {
            mount_point: '/',
            filesystem: 'ext4',
            total_bytes: 64 * 1024 ** 3,
            used_bytes: 18 * 1024 ** 3,
            available_bytes: 46 * 1024 ** 3,
            usage_percent: 28,
          },
        ],
      })
    }
    if (path.endsWith('/apps'))
      return registryAvailable
        ? jsonResponse({ applications: [], systemApplications: [] })
        : jsonResponse({ error: { message: 'unavailable' } }, 503)
    throw new Error(`Unexpected request: ${path}`)
  })
}

describe('DashboardPage', () => {
  it('renders real API data from independent queries', async () => {
    vi.stubGlobal('fetch', dashboardFetch())
    renderPage(<DashboardPage />)

    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0)
    expect((await screen.findAllByText('usecloud-dev')).length).toBeGreaterThan(0)
    expect(screen.getByText('Debian GNU/Linux 13')).toBeInTheDocument()
    expect(screen.getByText('12.4%')).toBeInTheDocument()
    expect(screen.getByText('0 installed applications')).toBeInTheDocument()
  })

  it('keeps system data visible when registry is unavailable', async () => {
    vi.stubGlobal('fetch', dashboardFetch(false))
    renderPage(<DashboardPage />)

    expect(await screen.findByText('Application registry unavailable.')).toBeInTheDocument()
    expect(screen.getAllByText('usecloud-dev').length).toBeGreaterThan(0)
  })
})
