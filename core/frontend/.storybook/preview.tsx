import '@/app/styles/index.css'

import type { Preview } from '@storybook/react-vite'
import { Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { AppQueryProvider } from '@/app/providers/AppQueryProvider'
import { WallpaperProvider } from '@/features/wallpaper'
import { ThemeProvider } from '@/shared/config/theme'
const preview: Preview = {
  decorators: [
    (Story) => (
      <AppQueryProvider>
        <ThemeProvider>
          <WallpaperProvider>
            <MemoryRouter>
              <div className="min-h-screen bg-surface p-6 text-on-surface">
                <Suspense fallback={<p>Loading component…</p>}>
                  <Story />
                </Suspense>
              </div>
            </MemoryRouter>
          </WallpaperProvider>
        </ThemeProvider>
      </AppQueryProvider>
    ),
  ],
  parameters: { a11y: { test: 'error' }, controls: { expanded: true } },
}
export default preview
