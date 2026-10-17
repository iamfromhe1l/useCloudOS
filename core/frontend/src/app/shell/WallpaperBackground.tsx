import { useWallpaper } from '@/features/wallpaper'

import styles from './AppShell.module.css'
export function WallpaperBackground() {
  const wallpaper = useWallpaper()
  return (
    <div
      className={styles.wallpaper}
      aria-hidden="true"
      data-wallpaper-kind={wallpaper.record.kind}
      style={{
        backgroundImage: wallpaper.url ? 'url("' + wallpaper.url + '")' : undefined,
        backgroundSize: wallpaper.record.fit === 'fill' ? 'cover' : 'contain',
      }}
    />
  )
}
