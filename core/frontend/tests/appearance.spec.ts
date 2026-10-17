import { expect, test } from '@playwright/test'

import { preparePage } from './helpers'
test.beforeEach(async ({ page }, info) => preparePage(page, info.title))
test('wallpaper upload, extraction, persistence, fit, removal and reset', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('button', { name: 'Choose image' })).toBeEnabled()
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d')!
    context.fillStyle = '#2868c4'
    context.fillRect(0, 0, 64, 64)
    return canvas.toDataURL('image/png').split(',')[1]!
  })
  await page
    .getByLabel('Wallpaper image file')
    .setInputFiles({ name: 'ocean.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
  await expect(page.getByText('ocean.png', { exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Use wallpaper colors' }).click()
  await expect(page.getByRole('switch', { name: 'Use wallpaper colors' })).toBeChecked()
  const seed = await page.locator('html').getAttribute('data-theme-seed')
  expect(seed).not.toBe('#a7c957')
  await page.getByRole('radio', { name: 'Fit', exact: true }).click()
  await page.reload()
  await expect(page.getByText('ocean.png', { exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Fit', exact: true })).toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-theme-seed', seed!)
  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(page.getByText('No wallpaper · tonal background')).toBeVisible()
  await page.reload()
  await expect(page.getByText('No wallpaper · tonal background')).toBeVisible()
  await page.getByRole('button', { name: 'Reset default' }).click()
  await expect(page.getByText('Moss ridges', { exact: true })).toBeVisible()
  await page
    .getByLabel('Wallpaper image file')
    .setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') })
  await expect(page.getByRole('alert')).toContainText('Choose a PNG')
})

test('accent swatches, theme modes and keyboard dock', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('radio', { name: 'Blue', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme-seed', '#6b9ee5')
  await page.getByRole('radio', { name: 'Blue', exact: true }).focus()
  await page.keyboard.down('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Indigo' })).toBeChecked()
  await page.keyboard.up('ArrowRight')
  await page.getByRole('radio', { name: 'Light', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('radio', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const home = page.getByRole('link', { name: 'Home', exact: true })
  await home.focus()
  await home.press('ArrowRight')
  await expect(
    page.locator('[data-dock]').getByRole('link', { name: 'Settings', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('End')
  await expect(
    page.locator('[data-dock]').getByRole('button', { name: 'Application actions', exact: true }),
  ).toBeFocused()
})

test('system mode follows operating system changes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/settings')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
