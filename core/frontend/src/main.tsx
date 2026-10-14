import './app/styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { WallpaperProvider } from '@/features/wallpaper'
import { ThemeProvider } from '@/shared/config/theme'

import { App } from './app/App'
import { AppQueryProvider } from './app/providers/AppQueryProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppQueryProvider>
      <ThemeProvider>
        <WallpaperProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WallpaperProvider>
      </ThemeProvider>
    </AppQueryProvider>
  </StrictMode>,
)
