import { expect, test } from '@playwright/test'

import { preparePage } from './helpers'
test.beforeEach(async ({ page }, info) => preparePage(page, info.title))
test('workspace never scrolls behind shell controls', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('button', { name: 'Choose image' })).toBeEnabled()
  const height = await page.evaluate(() => ({
    document: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }))
  expect(height.document).toBeLessThanOrEqual(height.viewport + 1)
  await page.goto('/')
  const launcher = page.getByRole('navigation', { name: 'Desktop applications' })
  await launcher.scrollIntoViewIfNeeded()
  const box = await launcher.boundingBox()
  const dock = await page.locator('[data-dock]').boundingBox()
  expect(box).not.toBeNull()
  expect(dock).not.toBeNull()
  expect(box!.y + box!.height).toBeLessThanOrEqual(dock!.y - 1)
})
