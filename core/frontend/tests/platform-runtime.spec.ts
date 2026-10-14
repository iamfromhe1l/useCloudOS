// Real integration proof. Opt in against a disposable development registry.
import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'
test('independent Containers installation, browser load and removal', async ({ page, request }) => {
  test.skip(
    process.env.USECLOUD_INTEGRATION !== '1',
    'Requires real Lima Core and a Containers package; no production mocks',
  )
  const api = 'http://127.0.0.1:8080'
  const before = await request.get(api + '/api/v1/apps')
  const registry = (await before.json()) as {
    applications: { manifest: { metadata: { id: string } } }[]
  }
  expect(
    registry.applications.some((a) => a.manifest.metadata.id === 'containers'),
    'Refusing to remove an existing app',
  ).toBe(false)
  const data = await readFile(
    new URL('../../../artifacts/containers-0.1.0.usecloud', import.meta.url),
  )
  let installed = false
  try {
    await page.goto('/')
    await expect(
      page.getByRole('navigation', { name: 'Desktop applications' }).getByText('Containers'),
    ).toHaveCount(0)
    const response = await request.post(api + '/api/v1/apps/install?confirm=1', { data })
    expect(response.status()).toBe(201)
    expect((await response.json()).status).toBe('running')
    installed = true
    await page.reload()
    await page
      .getByRole('navigation', { name: 'Desktop applications' })
      .getByText('Containers')
      .click()
    await expect(page.locator('usecloud-containers-v0-1-0')).toBeVisible()
    await expect(page.getByText(/services on Docker Engine/)).toBeVisible()
    const body = await (await request.get(api + '/api/apps/containers/docker/info')).json()
    expect(body.available).toBe(true)
    const removed = await request.delete(api + '/api/v1/apps/containers?confirm=1')
    expect(removed.status()).toBe(204)
    installed = false
    await page.goto('/')
    await page.reload()
    await expect(
      page.getByRole('navigation', { name: 'Desktop applications' }).getByText('Containers'),
    ).toHaveCount(0)
    expect((await request.get(api + '/api/v1/health')).status()).toBe(200)
  } finally {
    if (installed) await request.delete(api + '/api/v1/apps/containers?confirm=1')
  }
})
