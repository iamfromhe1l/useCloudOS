import '@/app/styles/index.css'

import type { Preview } from '@storybook/react-vite'
import { Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { AppQueryProvider } from '@/app/providers/AppQueryProvider'
import { WallpaperProvider } from '@/features/wallpaper'
import { ThemeProvider } from '@/shared/config/theme'
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Shell color mode',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['dark', 'light'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark' },
  decorators: [
    (Story, context) => {
      window.localStorage.setItem('usecloudos-theme-mode', context.globals.theme)
      return (
        <AppQueryProvider>
          <ThemeProvider key={context.globals.theme}>
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
      )
    },
  ],
  parameters: { a11y: { test: 'error' }, controls: { expanded: true } },
}
export default preview
