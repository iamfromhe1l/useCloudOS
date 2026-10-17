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

test('Home widgets occupy disjoint named grid areas', async ({ page }) => {
  await page.goto('/')
  const cells = page.getByRole('region', { name: 'System widgets' }).locator(':scope > div')
  await expect(cells).toHaveCount(5)
  const boxes = await cells.evaluateAll((items) =>
    items.map((item) => {
      const b = item.getBoundingClientRect()
      return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }
    }),
  )
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!,
        b = boxes[j]!
      const overlap =
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
      expect(overlap, 'Desktop grid areas must never overlap').toBe(false)
    }
})
