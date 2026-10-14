import { defineConfig, devices } from '@playwright/test'

const viewports = {
  compact: { width: 390, height: 844 },
  medium: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  large: { width: 1920, height: 1080 },
} as const

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5173',
    colorScheme: 'dark',
    locale: 'en-US',
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
  },
  projects: Object.entries(viewports).map(([name, viewport]) => ({ name, use: { viewport } })),
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
