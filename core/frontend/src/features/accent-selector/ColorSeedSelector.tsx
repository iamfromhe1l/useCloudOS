import * as RadioGroup from '@radix-ui/react-radio-group'

import { accents } from '@/shared/config/accentSeeds'
import { useTheme } from '@/shared/config/theme'
import { Icon } from '@/shared/ui'

import styles from './ColorSeedSelector.module.css'
export function ColorSeedSelector({ disabled = false }: { disabled?: boolean }) {
  const { seed, setSeed, wallpaperThemeEnabled, setWallpaperThemeEnabled } = useTheme()
  const select = (next: string) => {
    setWallpaperThemeEnabled(false)
    setSeed(next)
  }
  return (
    <RadioGroup.Root
      disabled={disabled}
      orientation="horizontal"
      loop
      aria-label="Accent color"
      className={styles.palette}
      value={wallpaperThemeEnabled ? '' : seed}
      onValueChange={select}
    >
      {accents.map((accent) => (
        <RadioGroup.Item
          key={accent.name}
          value={accent.seed}
          aria-label={accent.name}
          className={styles.item}
        >
          <span className={styles.swatch} style={{ backgroundColor: accent.seed }}>
            <RadioGroup.Indicator>
              <Icon name="checkCircle" className="size-5" />
            </RadioGroup.Indicator>
          </span>
          <span>{accent.name}</span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  )
}
