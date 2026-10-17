import { readFile } from 'node:fs/promises'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

import { filesFixture } from './files-fixture'
import { assertShellGeometry } from './helpers'
test.beforeEach(async ({ page }, info) => filesFixture(page, info.title))

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
  await expect(page.getByRole('heading', { name: 'Files', exact: true }).first()).toBeVisible()
  await expect(page.getByText('Verified publisher · Test publisher').first()).toBeVisible()
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
  await page.getByRole('button', { name: 'Store options' }).click()
  await page.getByRole('menuitem', { name: 'Install from .usecloud file' }).click()
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

test('Files object menus, selection, cancel confirmation and retained refresh', async ({
  page,
}) => {
  await page.goto('/apps/files')
  const file = page.getByRole('button', { name: 'photo.jpg', exact: true })
  await file.click()
  await expect(file).toHaveAttribute('aria-pressed', 'true')
  await file.click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Download', exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('files-context-menu.png')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Actions for photo.jpg' }).click()
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(
    accessibility.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([])
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Actions for photo.jpg' })).toBeFocused()
  await page.route('**/api/apps/files/move', (route) => route.fulfill({ status: 204 }))
  await page.getByRole('button', { name: 'Actions for photo.jpg' }).click()
  await page.getByRole('menuitem', { name: 'Rename', exact: true }).click()
  await page.getByLabel('New name').fill('changed.jpg')
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Actions for photo.jpg' }).click()
  await page.getByRole('menuitem', { name: 'Move', exact: true }).click()
  await expect(page.getByLabel('Destination path')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.route('**/api/apps/files/entries?*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900))
    await route.fulfill({
      json: {
        entries: [
          {
            name: 'photo.jpg',
            path: 'photo.jpg',
            kind: 'file',
            size: 203000,
            modifiedAt: '2026-10-17T10:00:00Z',
          },
        ],
        total: 1,
        offset: 0,
        limit: 100,
      },
    })
  })
  await page.getByRole('button', { name: 'View', exact: true }).click()
  await page.getByRole('menuitemradio', { name: 'Size', exact: true }).click()
  await expect(file).toBeVisible()
  await expect(page.getByRole('status', { name: 'Reading folder' })).toHaveCount(0)
  await expect(file).toHaveAttribute('aria-pressed', 'true')
})

test('Files initial skeleton is local and noninteractive', async ({ page }) => {
  let release: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/apps/files/entries?*', async (route) => {
    await pending
    await route.fulfill({ json: { entries: [], total: 0, offset: 0, limit: 100 } })
  })
  await page.goto('/apps/files')
  await expect(page.getByRole('status', { name: 'Reading folder' })).toBeVisible()
  await expect(page).toHaveScreenshot('files-loading.png')
  release()
  await expect(page.getByText('No files here')).toBeVisible()
})

test('Store light detail and install pending state', async ({ page }) => {
  const manifest = parse(
    await readFile(new URL('../../../apps/files/manifest/manifest.yaml', import.meta.url), 'utf8'),
  )
  await page.route('**/api/v1/apps', (route) =>
    route.fulfill({
      json: {
        applications: [],
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
  let finish: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  await page.route('**/api/v1/catalog/files/install?*', async (route) => {
    await pending
    await route.fulfill({
      status: 503,
      json: { error: { code: 'INSTALL_FAILED', message: 'Service is temporarily unavailable' } },
    })
  })
  await page.goto('/store')
  await page.getByRole('button', { name: 'Files By useCloudOS' }).first().click()
  await expect(page.getByText('Requested access')).toBeVisible()
  await expect(page).toHaveScreenshot('store-detail-light.png')
  await page.getByRole('button', { name: 'Install', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm and grant requested permissions' }).click()
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Installing…' })).toBeDisabled()
  await expect(page).toHaveScreenshot('store-installing-light.png')
  finish()
  await expect(page.getByRole('alert')).toContainText('Service is temporarily unavailable')
  expect(manifest.metadata.id).toBe('files')
})
