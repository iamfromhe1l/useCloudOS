import { ColorSeedSelector } from '@/features/accent-selector'
import { ThemeSwitcher } from '@/features/theme-switcher'
import { useWallpaper, WallpaperSelector } from '@/features/wallpaper'
import { useTheme } from '@/shared/config/theme'
import { PillButton, SettingsSection } from '@/shared/ui'
import { Switch } from '@/shared/ui/selection'

import { SettingRow } from './SettingRow'
import styles from './Settings.module.css'
export function AppearanceSettings() {
  const theme = useTheme()
  const wallpaper = useWallpaper()
  return (
    <div>
      <h2 className={styles.heading}>Appearance</h2>
      <SettingsSection title="Theme">
        <SettingRow
          title="Color mode"
          description={'Currently rendered as ' + theme.resolvedMode + '.'}
        >
          <ThemeSwitcher />
        </SettingRow>
      </SettingsSection>
      <SettingsSection title="Accent color" description="Choose a curated Material source color.">
        <ColorSeedSelector disabled={wallpaper.busy} />
        <SettingRow
          title="Use wallpaper colors"
          description="Extract a source color when the image changes."
        >
          <Switch
            disabled={wallpaper.busy || wallpaper.record.kind === 'none'}
            label="Use wallpaper colors"
            checked={theme.wallpaperThemeEnabled}
            onCheckedChange={(enabled) => void wallpaper.setDynamicColors(enabled)}
          />
        </SettingRow>
      </SettingsSection>
      <SettingsSection
        title="Desktop wallpaper"
        description="Stored in this browser. Images up to 10 MB and 24 megapixels."
      >
        <WallpaperSelector />
      </SettingsSection>
      <SettingsSection title="Transparency">
        <SettingRow
          title="Reduce transparency"
          description="Use solid dock and control-center surfaces."
        >
          <Switch
            label="Reduce transparency"
            checked={theme.reduceTransparency}
            onCheckedChange={theme.setReduceTransparency}
          />
        </SettingRow>
      </SettingsSection>
      <div className={styles.footer}>
        <p>Preferences are stored in this browser.</p>
        <PillButton tone="quiet" onClick={theme.resetTheme}>
          Reset theme
        </PillButton>
      </div>
    </div>
  )
}
