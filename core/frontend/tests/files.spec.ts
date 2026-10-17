import { readFile } from 'node:fs/promises'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

import { assertShellGeometry, preparePage } from './helpers'
test.beforeEach(async ({ page }, info) => {
  await preparePage(page, info.title)
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
  await page.route('**/app-assets/files/0.1.0/**', async (route) => {
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
})
for (const mode of ['dark', 'light'])
  test('Files populated ' + mode, async ({ page }) => {
    await page.goto('/apps/files')
    await expect(page.getByRole('list', { name: 'Files and folders' })).toBeVisible()
    await assertShellGeometry(page)
    const result = await new AxeBuilder({ page }).analyze()
    expect(
      result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([])
    await expect(page).toHaveScreenshot('files-' + mode + '.png')
  })
test('Files empty and permission denied', async ({ page }) => {
  await page.route('**/api/apps/files/entries?*', (route) =>
    route.fulfill({ json: { entries: [], total: 0, offset: 0, limit: 100 } }),
  )
  await page.goto('/apps/files')
  await expect(page.getByText('No files here')).toBeVisible()
  await expect(page).toHaveScreenshot('files-empty.png')
  await page.route('**/api/apps/files/entries?*', (route) =>
    route.fulfill({
      status: 403,
      json: { error: { code: 'PERMISSION_DENIED', message: 'Shared storage permission denied' } },
    }),
  )
  await page.reload()
  await expect(page.getByText('Shared storage permission denied')).toBeVisible()
  await assertShellGeometry(page)
})
test('Store trust and Installed Apps details', async ({ page }) => {
  await page.goto('/store')
  await expect(page.getByRole('heading', { name: 'Files', exact: true })).toBeVisible()
  await expect(page.getByText('Verified publisher · Test publisher')).toBeVisible()
  await expect(page).toHaveScreenshot('store-files.png')
  const manifest = parse(
    await readFile(new URL('../../../apps/files/manifest/manifest.yaml', import.meta.url), 'utf8'),
  )
  await page.route('**/api/v1/apps/inspect', (route) =>
    route.fulfill({
      json: {
        manifest,
        trust: 'verified',
        digest: 'test',
        signature: {
          publisherName: 'Test publisher',
          publisherId: 'test-publisher',
          keyId: 'test-fingerprint',
        },
      },
    }),
  )
  await page.getByLabel('Select application package').setInputFiles({
    name: 'fixture.usecloud',
    mimeType: 'application/zip',
    buffer: Buffer.from('network fixture only'),
  })
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveScreenshot('files-install-trust.png')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.goto('/settings')
  await page.getByRole('tab', { name: 'Apps', exact: true }).click()
  await page.getByText('Application details and permissions').click()
  await expect(
    page.getByText('Read files in shared storage (medium risk)', { exact: false }).first(),
  ).toBeVisible()
  await expect(page).toHaveScreenshot('installed-files.png')
})
