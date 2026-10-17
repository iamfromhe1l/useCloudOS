import { expect, test } from '@playwright/test'

import { assertShellGeometry, preparePage } from './helpers'
test.beforeEach(async ({ page }, info) => preparePage(page, info.title))
test('failed application module leaves shell usable', async ({ page }) => {
  await page.route('**/app-assets/containers/0.1.0/frontend/index.js*', (route) =>
    route.fulfill({ status: 503, body: 'unavailable' }),
  )
  await page.goto('/apps/containers')
  await expect(page.getByRole('alert')).toContainText('Application failed to load')
  await page.locator('[data-dock]').getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible()
  await assertShellGeometry(page)
})
test('app CSS remains inside Shadow DOM and inherits shell theme', async ({ page }) => {
  await page.goto('/apps/containers')
  await expect(page.getByText('example-container', { exact: true })).toBeVisible()
  const launcher = page.getByRole('link', { name: 'Open Home' })
  const before = await launcher.evaluate((element) => getComputedStyle(element).fontSize)
  const values = await page.locator('usecloud-containers-v0-1-0').evaluate((element) => {
    const style = document.createElement('style')
    style.textContent = 'button {font-size:99px!important} body {display:none!important}'
    element.shadowRoot?.append(style)
    return {
      shell: getComputedStyle(document.documentElement).getPropertyValue('--uc-primary'),
      app: getComputedStyle(element).getPropertyValue('--uc-primary'),
    }
  })
  expect(values.app).toBe(values.shell)
  expect(await launcher.evaluate((element) => getComputedStyle(element).fontSize)).toBe(before)
  await expect(launcher).toBeVisible()
})
