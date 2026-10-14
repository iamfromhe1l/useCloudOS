import { expect, test } from '@playwright/test'

import { assertShellGeometry, container, preparePage } from './helpers'
test.beforeEach(async ({ page }, info) => preparePage(page, info.title))
test('very long system and container strings', async ({ page }) => {
  const long = 'very-long-unbroken-value-'.repeat(18)
  await page.route('**/api/v1/system/info', (route) =>
    route.fulfill({
      json: {
        hostname: long,
        os: { name: 'Debian GNU/Linux', version: '13' },
        kernel: { release: long, architecture: 'x86_64' },
        uptime_seconds: 1234,
      },
    }),
  )
  await page.goto('/')
  await expect(page.getByText(long, { exact: true }).first()).toBeVisible()
  await assertShellGeometry(page)
  await expect(page).toHaveScreenshot('home-long-values.png', { fullPage: true })
  await page.route('**/api/apps/containers/containers', (route) =>
    route.fulfill({
      json: { containers: [{ ...container, name: long, image: long, status: long }] },
    }),
  )
  await page.goto('/apps/containers')
  await expect(page.getByRole('heading', { level: 2, name: long }).first()).toBeVisible()
  await assertShellGeometry(page)
  await expect(page).toHaveScreenshot('containers-long-values.png')
  await page.route('**/api/apps/containers/containers/container-123', (route) =>
    route.fulfill({
      json: {
        ...container,
        name: long,
        image: long,
        started_at: container.created_at,
        restart_count: 0,
        ports: [],
      },
    }),
  )
  await page.goto('/apps/containers/container-123')
  await expect(page.getByRole('heading', { level: 2, name: long }).first()).toBeVisible()
  await assertShellGeometry(page)
})
