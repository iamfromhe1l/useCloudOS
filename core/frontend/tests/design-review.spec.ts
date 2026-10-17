import { mkdir, readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import { realSession } from './real-session'

test.use({ trace: 'off' })
test('real application design review matrix', async ({ page, request }, info) => {
  test.skip(process.env.USECLOUD_DESIGN_REVIEW !== '1', 'Explicit real application visual audit')
  test.setTimeout(180_000)
  const round = process.env.USECLOUD_DESIGN_ROUND ?? 'baseline'
  const directory = '../../artifacts/design-v2/' + round + '/' + info.project.name
  await mkdir(directory, { recursive: true })
  await realSession(request, page)
  const api = 'http://127.0.0.1:8080'
  const registry = await (await request.get(api + '/api/v1/apps')).json()
  if (process.env.USECLOUD_REFRESH_FILES === '1') {
    expect((await request.delete(api + '/api/v1/apps/files?confirm=1')).ok()).toBe(true)
    const data = await readFile(new URL('../../../artifacts/files-0.2.0.usecloud', import.meta.url))
    expect((await request.post(api + '/api/v1/apps/install?confirm=1', { data })).ok()).toBe(true)
  }
  if (
    !registry.applications.some(
      (a: { manifest: { metadata: { id: string } } }) => a.manifest.metadata.id === 'files',
    )
  ) {
    const data = await readFile(new URL('../../../artifacts/files-0.2.0.usecloud', import.meta.url))
    const install = await request.post(api + '/api/v1/apps/install?confirm=1', { data })
    expect(install.ok()).toBe(true)
  }
  for (const id of ['files', 'containers']) {
    const installed = registry.applications.find(
      (a: { manifest: { metadata: { id: string } } }) => a.manifest.metadata.id === id,
    )
    if (installed && installed.manifest.metadata.version !== '0.2.0') {
      const data = await readFile(
        new URL('../../../artifacts/' + id + '-0.2.0.usecloud', import.meta.url),
      )
      const update = await request.post(api + '/api/v1/apps/update?confirm=1', { data })
      expect(update.ok()).toBe(true)
    }
  }
  for (const mode of ['dark', 'light']) {
    await page.addInitScript((value) => localStorage.setItem('usecloudos-theme-mode', value), mode)
    for (const [name, path] of Object.entries({
      home: '/',
      files: '/apps/files',
      store: '/store',
      settings: '/settings',
      containers: '/apps/containers',
    })) {
      await page.goto(path)
      await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('status').filter({ hasText: 'Loading page' })).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      if (name === 'files')
        await expect(
          page.getByRole('list', { name: 'Files and folders' }).or(page.getByText('No files here')),
        ).toBeVisible()
      if (name === 'store')
        await expect(
          page.getByRole('heading', { name: 'Files', exact: true }).first(),
        ).toBeVisible()
      if (name === 'containers')
        await expect(page.getByText(/services on Docker Engine/)).toBeVisible()
      await page.screenshot({
        path: directory + '/' + name + '-' + mode + '.png',
        animations: 'disabled',
      })
      if (name === 'files') {
        const menu = page.getByRole('button', { name: /^Actions for / }).first()
        if (await menu.count()) {
          await menu.click()
          await expect(page.getByRole('menu')).toBeVisible()
          await page.screenshot({
            path: directory + '/files-menu-' + mode + '.png',
            animations: 'disabled',
          })
          await page.keyboard.press('Escape')
        }
      }
      if (name === 'store') {
        await page.locator('[data-catalog-app]').first().getByRole('button').first().click()
        await expect(page.getByText('Requested access', { exact: true })).toBeVisible()
        await page.screenshot({
          path: directory + '/store-detail-' + mode + '.png',
          animations: 'disabled',
        })
      }
      if (name === 'containers') {
        const open = page.getByRole('link', { name: /View details for/ }).first()
        if (await open.count()) {
          await open.click()
          await expect(page.getByRole('region', { name: 'Container overview' })).toBeVisible()
          await page.screenshot({
            path: directory + '/container-details-' + mode + '.png',
            animations: 'disabled',
          })
        }
      }
    }
    await page.goto('/')
    await page.getByRole('button', { name: 'Open control center' }).click()
    await expect(page.getByRole('dialog', { name: 'Control Center' })).toBeVisible()
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible()
    await page.screenshot({
      path: directory + '/control-center-' + mode + '.png',
      animations: 'disabled',
    })
  }
  await page.context().clearCookies()
  for (const mode of ['dark', 'light']) {
    await page.addInitScript((value) => localStorage.setItem('usecloudos-theme-mode', value), mode)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
    await page.screenshot({ path: directory + '/login-' + mode + '.png', animations: 'disabled' })
  }
})
