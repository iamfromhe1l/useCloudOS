import { readFile } from 'node:fs/promises'

import type { Page } from '@playwright/test'
import { parse } from 'yaml'

import { preparePage } from './helpers'
export async function filesFixture(page: Page, title: string) {
  await preparePage(page, title)
  const manifest = parse(
    await readFile(new URL('../../../apps/files/manifest/manifest.yaml', import.meta.url), 'utf8'),
  )
  const application = {
    manifest,
    trust: 'verified',
    status: 'running',
    grants: manifest.permissions,
    installedAt: '2026-10-17T00:00:00Z',
    updatedAt: '2026-10-17T00:00:00Z',
    publisherName: 'Test publisher',
    digest: 'test',
  }
  await page.route('**/api/v1/apps', (route) =>
    route.fulfill({
      json: {
        applications: [application],
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
      },
    }),
  )
  await page.route('**/api/v1/catalog', (route) =>
    route.fulfill({
      json: {
        applications: [
          {
            manifest,
            trust: 'verified',
            digest: 'test',
            signature: { publisherName: 'Test publisher', keyId: 'test-fingerprint' },
          },
        ],
        source: 'local',
      },
    }),
  )
  await page.route('**/app-assets/files/0.2.0/**', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/frontend/')[1]
    if (!name || name.includes('..')) return route.abort()
    return route.fulfill({
      body: await readFile(new URL('../../../apps/files/frontend/dist/' + name, import.meta.url)),
      contentType: name.endsWith('.css') ? 'text/css' : 'text/javascript',
    })
  })
  await page.route('**/api/apps/files/root', (route) =>
    route.fulfill({
      json: {
        name: 'Shared storage',
        writable: true,
        totalBytes: 32 * 1024 ** 3,
        availableBytes: 24 * 1024 ** 3,
        maxUploadBytes: 2 * 1024 ** 3,
      },
    }),
  )
  const entries = [
    {
      name: 'Documents',
      path: 'Documents',
      kind: 'directory',
      size: 4096,
      modifiedAt: '2026-10-17T10:00:00Z',
    },
    {
      name: 'very-long-unicode-🌿-данные-'.repeat(7) + '.txt',
      path: 'long.txt',
      kind: 'file',
      size: 1048576,
      modifiedAt: '2026-10-17T10:00:00Z',
    },
    {
      name: 'photo.jpg',
      path: 'photo.jpg',
      kind: 'file',
      size: 203000,
      modifiedAt: '2026-10-17T10:00:00Z',
    },
  ]
  await page.route('**/api/apps/files/entries?*', (route) =>
    route.fulfill({ json: { entries, total: 3, offset: 0, limit: 100 } }),
  )
}
