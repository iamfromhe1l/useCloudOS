import { type ThemeMode, useTheme } from '@/shared/config/theme'
import { SegmentedControl } from '@/shared/ui/selection'
const options = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
] as const
export function ThemeSwitcher() {
  const { mode, setMode } = useTheme()
  return (
    <SegmentedControl<ThemeMode>
      label="Color mode"
      value={mode}
      onChange={setMode}
      options={options}
    />
  )
}
