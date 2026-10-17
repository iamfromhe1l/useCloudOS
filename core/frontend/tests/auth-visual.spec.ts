import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { preparePage } from './helpers'
for (const mode of ['dark', 'light'])
  test('device login ' + mode, async ({ page }) => {
    await preparePage(page, mode)
    await page.route('**/api/v1/session', (route) =>
      route.fulfill({
        status: 401,
        json: { error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      }),
    )
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome home' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
    await page.evaluate(() => document.fonts.ready)
    const results = await new AxeBuilder({ page }).analyze()
    expect(
      results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([])
    await expect(page).toHaveScreenshot('login-' + mode + '.png')
  })
