import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import { realSession } from './real-session'
test.use({ trace: 'off' }) // Never retain credential-bearing login traces.
test('signed Files install, real login and filesystem UI lifecycle', async ({ page, request }) => {
  test.setTimeout(60_000)
  test.skip(
    process.env.USECLOUD_FILES_INTEGRATION !== '1',
    'Requires explicit real Lima integration and fresh Files registry',
  )
  const api = 'http://127.0.0.1:8080'
  await realSession(request, page)
  const before = await request.get(api + '/api/v1/apps')
  expect(
    (await before.json()).applications.some(
      (a: { manifest: { metadata: { id: string } } }) => a.manifest.metadata.id === 'files',
    ),
    'Refusing to remove a pre-existing app',
  ).toBe(false)
  const data = await readFile(new URL('../../../artifacts/files-0.2.0.usecloud', import.meta.url))
  const folder = 'browser-proof-' + Date.now()
  let installed = false
  try {
    await page.goto('/store')
    const card = page.locator('[data-catalog-app="files"]').last()
    await expect(card.getByText(/Verified publisher/)).toBeVisible()
    const inspect = await request.post(api + '/api/v1/apps/inspect', { data })
    expect((await inspect.json()).trust).toBe('verified')
    await card.getByRole('button', { name: 'Install', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm and grant requested permissions' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    installed = true
    await page.goto('/apps/files')
    await expect(page.locator('usecloud-files-v0-2-0')).toBeVisible()
    await page.getByRole('button', { name: 'New folder' }).click()
    await page.getByLabel('Folder name').fill(folder)
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await expect(page.getByRole('button', { name: folder, exact: true })).toBeVisible()
    await page.getByRole('button', { name: folder, exact: true }).click()
    await page.getByLabel('Choose file to upload').setInputFiles({
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('real Files browser proof'),
    })
    await expect(page.getByRole('button', { name: 'hello.txt', exact: true })).toBeVisible()
    const download = await request.get(
      api + '/api/apps/files/content?path=' + encodeURIComponent(folder + '/hello.txt'),
    )
    expect(await download.text()).toBe('real Files browser proof')
    await page.getByRole('button', { name: 'Actions for hello.txt' }).click()
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click()
    await page.getByLabel('New name').fill('renamed.txt')
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page.getByRole('button', { name: 'renamed.txt', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Actions for renamed.txt' }).click()
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click()
    await expect(page.getByText(/Deletion is permanent/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page.getByText('No files here')).toBeVisible()
    await request.delete(api + '/api/apps/files/entries?path=' + folder)
    const removed = await request.delete(api + '/api/v1/apps/files?confirm=1')
    expect(removed.status()).toBe(204)
    installed = false
    expect((await request.get(api + '/api/v1/health')).status()).toBe(200)
  } finally {
    if (installed) {
      const call = (path: string) =>
        execFileSync(
          'limactl',
          [
            'shell',
            '--workdir',
            '/workspace/usecloudos',
            'usecloud-dev',
            '--',
            'sudo',
            'bash',
            'scripts/platform-admin-guest',
            '-X',
            'DELETE',
            api + path,
          ],
          { stdio: 'pipe' },
        )
      call('/api/apps/files/entries?path=' + folder + '&recursive=1')
      call('/api/v1/apps/files?confirm=1')
    }
    await request.post(api + '/api/v1/logout').catch(() => {})
  }
})
