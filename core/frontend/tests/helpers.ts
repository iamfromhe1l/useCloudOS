import { readFile } from 'node:fs/promises'

import { expect, type Page } from '@playwright/test'
import { parse } from 'yaml'
export const container = {
  id: 'container-123',
  name: 'example-container',
  image: 'example/image:1.0',
  state: 'running',
  status: 'Up 2 hours',
  created_at: '2026-10-06T12:00:00Z',
}

export async function mockBackend(page: Page) {
  await page.route('**/app-assets/containers/0.1.0/**', async (route) => {
    const relative = new URL(route.request().url()).pathname.split('/frontend/')[1]
    if (!relative || relative.includes('..')) return route.abort()
    const body = await readFile(
      new URL('../../../apps/containers/frontend/dist/' + relative, import.meta.url),
    )
    return route.fulfill({
      body,
      contentType: relative.endsWith('.css') ? 'text/css' : 'text/javascript',
    })
  })

  await page.route(/\/api\/(?:v1|apps)\//, async (route) => {
    const path = new URL(route.request().url()).pathname
    const responses: Record<string, unknown> = {
      '/api/v1/session': { id: 'development', username: 'development', role: 'admin' },
      '/api/v1/apps': {
        systemApplications: [
          {
            id: 'home',
            name: 'Home',
            route: '/',
            icon: 'home',
            colorRole: 'primary',
            desktop: false,
            dock: true,
          },
          {
            id: 'settings',
            name: 'Settings',
            route: '/settings',
            icon: 'settings',
            colorRole: 'secondary',
            desktop: true,
            dock: true,
          },
          {
            id: 'store',
            name: 'Store',
            route: '/store',
            icon: 'apps',
            colorRole: 'tertiary',
            desktop: true,
            dock: true,
          },
        ],
        applications: [
          {
            manifest: parse(
              await readFile(
                new URL('../../../apps/containers/manifest/manifest.yaml', import.meta.url),
                'utf8',
              ),
            ),
            status: 'running',
            trust: 'unsigned',
            grants: ['docker.read', 'docker.manage'],
            installedAt: '2026-10-14T00:00:00Z',
            updatedAt: '2026-10-14T00:00:00Z',
            digest: 'test',
          },
        ],
      },
      '/api/v1/notifications': { notifications: [] },
      '/api/v1/system/info': {
        hostname: 'usecloud-dev',
        os: { name: 'Debian GNU/Linux', version: '13' },
        kernel: { release: '6.12.111+deb13-cloud-amd64', architecture: 'x86_64' },
        uptime_seconds: 13_320,
      },
      '/api/v1/system/resources': {
        cpu: { logical_cores: 4, usage_percent: 12.4 },
        memory: {
          total_bytes: 8 * 1024 ** 3,
          available_bytes: 5 * 1024 ** 3,
          used_bytes: 3 * 1024 ** 3,
          usage_percent: 37.5,
        },
      },
      '/api/v1/storage/filesystems': {
        filesystems: [
          {
            mount_point: '/',
            filesystem: 'ext4',
            total_bytes: 64 * 1024 ** 3,
            used_bytes: 18 * 1024 ** 3,
            available_bytes: 46 * 1024 ** 3,
            usage_percent: 28,
          },
          {
            mount_point: '/data',
            filesystem: 'ext4',
            total_bytes: 32 * 1024 ** 3,
            used_bytes: 2 * 1024 ** 3,
            available_bytes: 30 * 1024 ** 3,
            usage_percent: 6.25,
          },
        ],
      },
      '/api/apps/containers/docker/info': {
        available: true,
        server_version: '29.8.2',
        api_version: '1.56',
        containers: 1,
        containers_running: 1,
        containers_stopped: 0,
        images: 2,
      },
      '/api/apps/containers/containers': { containers: [container] },
      '/api/apps/containers/containers/container-123': {
        ...container,
        started_at: '2026-10-06T12:01:00Z',
        restart_count: 0,
        ports: [{ host_port: 8088, container_port: 80, protocol: 'tcp' }],
      },
      '/api/apps/containers/containers/container-123/stats': {
        cpu_percent: 3.2,
        memory: { used_bytes: 256 * 1024 ** 2, limit_bytes: 8 * 1024 ** 3, usage_percent: 3.1 },
        network: { rx_bytes: 123456, tx_bytes: 654321 },
        block_io: { read_bytes: 12345678, write_bytes: 8765432 },
      },
      '/api/apps/containers/containers/container-123/logs': {
        logs: 'example-container started\nlistening on port 80\n',
        truncated: false,
      },
    }
    const body = responses[path]
    if (!body)
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'not found' } }),
      })
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

export async function preparePage(page: Page, title: string) {
  await page.clock.setFixedTime(new Date('2026-10-14T20:43:00Z'))
  const mode = title.includes('light') ? 'light' : title.includes('system mode') ? 'system' : 'dark'
  await page.addInitScript((initialMode) => {
    if (!localStorage.getItem('usecloudos-theme-mode'))
      localStorage.setItem('usecloudos-theme-mode', initialMode)
    if (!localStorage.getItem('usecloudos-theme-seed'))
      localStorage.setItem('usecloudos-theme-seed', '#a7c957')
  }, mode)
  await mockBackend(page)
}
export async function assertShellGeometry(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflow).toBe(false)
  const workspaceOverflow = await page
    .locator('[data-workspace]')
    .evaluate((element) => element.scrollWidth > element.clientWidth)
  expect(workspaceOverflow).toBe(false)
  const windowBox = (await page.locator('[data-app-window]').count())
    ? await page.locator('[data-app-window]').boundingBox()
    : null
  const dockBox = await page.locator('[data-dock]').boundingBox()
  if (windowBox && dockBox)
    expect(windowBox.y + windowBox.height).toBeLessThanOrEqual(dockBox.y - 1)
  const systemBar = await page.getByRole('banner', { name: 'System bar' }).boundingBox()
  expect(systemBar?.y).toBe(0)
}
