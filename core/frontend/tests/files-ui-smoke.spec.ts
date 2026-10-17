import { expect, test } from '@playwright/test'

import { realSession } from './real-session'
test.use({ trace: 'off' })
test('real Files design workflow preserves shell and unrelated files', async ({
  page,
  request,
}) => {
  test.skip(process.env.USECLOUD_FILES_UI_SMOKE !== '1', 'Explicit real installed Files workflow')
  test.setTimeout(60_000)
  page.setDefaultTimeout(10_000)
  await realSession(request, page)
  const api = 'http://127.0.0.1:8080'
  const folder = 'design-proof-' + Date.now()
  let created = false
  try {
    await page.goto('/apps/files')
    await page.getByRole('button', { name: 'New folder', exact: true }).click()
    await page.getByLabel('Folder name').fill(folder)
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await expect(page.getByRole('button', { name: folder, exact: true })).toBeVisible()
    created = true
    await page.getByRole('button', { name: folder, exact: true }).click()
    await page.getByRole('button', { name: 'New folder', exact: true }).click()
    await page.getByLabel('Folder name').fill('archive')
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await page.getByLabel('Choose file to upload').setInputFiles({
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Design System 2.0 real upload proof'),
    })
    await expect(page.getByRole('button', { name: 'hello.txt', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Actions for hello.txt' }).click()
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click()
    await page.getByLabel('New name').fill('renamed.txt')
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page.getByRole('button', { name: 'renamed.txt', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Actions for renamed.txt' }).click()
    await page.getByRole('menuitem', { name: 'Move', exact: true }).click()
    await page.getByLabel('Destination path').fill(folder + '/archive/renamed.txt')
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page.getByRole('button', { name: 'renamed.txt', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'archive', exact: true }).click()
    await expect(page.getByRole('button', { name: 'renamed.txt', exact: true })).toBeVisible()
    const response = await request.get(
      api + '/api/apps/files/content?path=' + encodeURIComponent(folder + '/archive/renamed.txt'),
    )
    expect(await response.text()).toBe('Design System 2.0 real upload proof')
    await page.getByRole('button', { name: 'Actions for renamed.txt' }).click()
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page.getByText('No files here')).toBeVisible()
    await page.getByRole('button', { name: 'Close Files', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible()
    expect((await request.get(api + '/api/v1/health')).ok()).toBe(true)
  } finally {
    if (created)
      await request
        .delete(
          api + '/api/apps/files/entries?' + new URLSearchParams({ path: folder, recursive: '1' }),
        )
        .catch(() => {})
    await request.post(api + '/api/v1/logout').catch(() => {})
  }
})
