export { useWallpaper, WallpaperProvider } from './WallpaperProvider'
import { lazy } from 'react'
export const WallpaperSelector = lazy(() =>
  import('./WallpaperSelector').then((module) => ({ default: module.WallpaperSelector })),
)
