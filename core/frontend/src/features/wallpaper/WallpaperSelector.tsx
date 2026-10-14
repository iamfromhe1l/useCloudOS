import { useRef } from 'react'

import { PillButton } from '@/shared/ui'
import { SegmentedControl } from '@/shared/ui/selection'

import type { WallpaperFit } from './repository'
import { useWallpaper } from './WallpaperProvider'
import styles from './WallpaperSelector.module.css'
const fits = [
  { value: 'fill', label: 'Fill' },
  { value: 'fit', label: 'Fit' },
] as const
export function WallpaperSelector() {
  const input = useRef<HTMLInputElement>(null)
  const wallpaper = useWallpaper()
  const choose = () => input.current?.click()
  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void wallpaper.select(file)
    event.target.value = ''
  }
  return (
    <div className={styles.selector}>
      <div className={styles.preview}>
        {wallpaper.url ? (
          <img
            src={wallpaper.url}
            alt="Current desktop wallpaper"
            style={{ objectFit: wallpaper.record.fit === 'fill' ? 'cover' : 'contain' }}
          />
        ) : (
          <span>No wallpaper · tonal background</span>
        )}
      </div>
      <p className={styles.name}>
        {wallpaper.record.name ??
          (wallpaper.record.kind === 'default' ? 'Moss ridges' : 'No wallpaper')}
      </p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only top-0 left-0"
        tabIndex={-1}
        aria-label="Wallpaper image file"
        onChange={onFile}
      />
      <div className={styles.actions}>
        <PillButton onClick={choose} disabled={wallpaper.busy}>
          Choose image
        </PillButton>
        <PillButton
          onClick={() => void wallpaper.remove()}
          disabled={wallpaper.busy || !wallpaper.url}
        >
          Remove
        </PillButton>
        <PillButton onClick={() => void wallpaper.reset()} disabled={wallpaper.busy}>
          Reset default
        </PillButton>
      </div>
      <div className={styles.fit}>
        <span>Wallpaper fit</span>
        <SegmentedControl<WallpaperFit>
          disabled={wallpaper.busy}
          label="Wallpaper fit"
          value={wallpaper.record.fit}
          options={fits}
          onChange={(fit) => void wallpaper.setFit(fit)}
        />
      </div>
      {wallpaper.busy && <p role="status">Updating wallpaper…</p>}
      {wallpaper.error && (
        <p role="alert" className="text-error">
          {wallpaper.error}
        </p>
      )}
    </div>
  )
}
