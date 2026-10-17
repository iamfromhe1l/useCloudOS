import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

import { assertShellGeometry, preparePage } from './helpers'
async function verifyPage(page: Page, path: string, screenshot: string) {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('html')).toHaveAttribute('data-theme-seed', '#a7c957')
  await assertShellGeometry(page)
  const results = await new AxeBuilder({ page }).analyze()
  expect(
    results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([])
  await expect(page).toHaveScreenshot(screenshot, { fullPage: true, animations: 'disabled' })
}

test.beforeEach(async ({ page }, info) => preparePage(page, info.title))
test('dashboard visual shell', async ({ page }) => {
  await verifyPage(page, '/', 'dashboard.png')
})

test('containers visual shell', async ({ page }) => {
  await verifyPage(page, '/apps/containers', 'containers.png')
})

test('container details visual shell', async ({ page }) => {
  await verifyPage(page, '/apps/containers/container-123', 'container-details.png')
  await page.getByRole('tab', { name: 'Stats', exact: true }).click()
  await expect(page.getByText('3.2%')).toBeVisible()
  await page.getByRole('tab', { name: 'Logs', exact: true }).click()
  await expect(page.getByText(/listening on port 80/)).toBeVisible()
})

test('Container Logs action preserves route and does not remount the app router', async ({
  page,
}) => {
  await page.goto('/apps/containers')
  await page.getByRole('button', { name: 'More actions for example-container' }).click()
  await page.getByRole('menuitem', { name: 'Logs', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Logs', exact: true })).toHaveAttribute(
    'data-state',
    'active',
  )
  await expect(page.getByText(/listening on port 80/)).toBeVisible()
  await page.getByRole('button', { name: 'Close Containers', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible()
})

test('settings visual shell', async ({ page }) => {
  await verifyPage(page, '/settings', 'settings.png')
})

test('control center visual shell', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open control center' }).click()
  await expect(page.getByRole('dialog', { name: 'Control Center' })).toBeVisible()
  await expect(page.getByText('No recent system events')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const results = await new AxeBuilder({ page }).analyze()
  expect(
    results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([])
  await expect(page).toHaveScreenshot('control-center.png', {
    fullPage: true,
    animations: 'disabled',
  })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Control Center' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Open control center' })).toBeFocused()
  await page.getByRole('button', { name: 'Open control center' }).click()
  await expect(page.getByRole('dialog', { name: 'Control Center' })).toBeVisible()
})

for (const screen of [
  { name: 'home', path: '/' },
  { name: 'containers', path: '/apps/containers' },
  { name: 'settings', path: '/settings' },
]) {
  test(screen.name + ' light theme', async ({ page }) => {
    await verifyPage(page, screen.path, screen.name + '-light.png')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })
}

test('control center light theme', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open control center' }).click()
  await expect(page.getByText('No recent system events')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const results = await new AxeBuilder({ page }).analyze()
  expect(
    results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
  ).toEqual([])
  await expect(page).toHaveScreenshot('control-center-light.png', { animations: 'disabled' })
})

test('desktop object menu and resources popup', async ({ page }, info) => {
  await page.goto('/')
  const desktop = page.getByRole('navigation', { name: 'Desktop applications' })
  await desktop.getByRole('link', { name: 'Settings', exact: true }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Open', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  if (info.project.name !== 'compact') {
    await page.getByRole('button', { name: 'System resources' }).click()
    await expect(page.getByRole('dialog', { name: 'System resources' })).toBeVisible()
    const result = await new AxeBuilder({ page }).analyze()
    expect(
      result.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([])
    await expect(page).toHaveScreenshot('resource-popover.png')
    await page.keyboard.press('Escape')
  }
})

test('Dock contextual actions are lazy, keyboard accessible and route to app management', async ({
  page,
}) => {
  await page.goto('/apps/containers')
  const dock = page.getByRole('navigation', { name: 'Primary navigation' })
  await dock.getByRole('link', { name: 'Containers', exact: true }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Manage application' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Manage application' }).click()
  await expect(page.getByRole('tab', { name: 'Apps', exact: true })).toHaveAttribute(
    'data-state',
    'active',
  )
  await page.getByRole('button', { name: 'Application actions', exact: true }).click()
  await expect(page.getByRole('menuitem', { name: 'Close application' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Application actions', exact: true })).toBeFocused()
})
