import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  applyThemeVariables,
  createThemeVariables,
  DEFAULT_SEED,
  type ResolvedThemeMode,
  resolveThemeMode,
  THEME_MODE_KEY,
  THEME_SEED_KEY,
  type ThemeMode,
} from './theme'

interface ThemeContextValue {
  mode: ThemeMode
  resolvedMode: ResolvedThemeMode
  seed: string
  reduceTransparency: boolean
  wallpaperThemeEnabled: boolean
  setWallpaperThemeEnabled: (enabled: boolean) => void
  setMode: (mode: ThemeMode) => void
  setSeed: (seed: string) => void
  setWallpaperSeed: (seed: string) => void
  setReduceTransparency: (reduce: boolean) => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const TRANSPARENCY_KEY = 'usecloudos-reduce-transparency'

function initialMode(): ThemeMode {
  const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(THEME_MODE_KEY)
  return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'dark'
}

function initialSeed() {
  return typeof window === 'undefined'
    ? DEFAULT_SEED
    : (window.localStorage.getItem(THEME_SEED_KEY) ?? DEFAULT_SEED)
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode)
  const [wallpaperThemeEnabled, setWallpaperThemeState] = useState(
    () => window.localStorage.getItem('usecloudos-wallpaper-theme') === 'true',
  )
  const setWallpaperThemeEnabled = useCallback((enabled: boolean) => {
    window.localStorage.setItem('usecloudos-wallpaper-theme', String(enabled))
    setWallpaperThemeState(enabled)
    if (!enabled) {
      const manualSeed = window.localStorage.getItem('usecloudos-manual-seed') ?? DEFAULT_SEED
      window.localStorage.setItem(THEME_SEED_KEY, manualSeed)
      setSeedState(manualSeed)
    }
  }, [])
  const [seed, setSeedState] = useState(initialSeed)
  const [reduceTransparency, setReduceTransparencyState] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(TRANSPARENCY_KEY) === 'true',
  )
  const [systemMode, setSystemMode] = useState<ResolvedThemeMode>(() => resolveThemeMode('system'))
  const resolvedMode = mode === 'system' ? systemMode : mode

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const update = () => setSystemMode(media.matches ? 'light' : 'dark')
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let active = true
    void createThemeVariables(seed, resolvedMode).then((variables) => {
      if (active) applyThemeVariables(document.documentElement, variables, resolvedMode, seed)
    })
    return () => {
      active = false
    }
  }, [resolvedMode, seed])

  useEffect(() => {
    document.documentElement.dataset.reduceTransparency = String(reduceTransparency)
  }, [reduceTransparency])

  const setMode = useCallback((nextMode: ThemeMode) => {
    window.localStorage.setItem(THEME_MODE_KEY, nextMode)
    setModeState(nextMode)
  }, [])

  const setSeed = useCallback((nextSeed: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(nextSeed)) return
    window.localStorage.setItem(THEME_SEED_KEY, nextSeed)
    window.localStorage.setItem('usecloudos-manual-seed', nextSeed)
    setSeedState(nextSeed.toLowerCase())
  }, [])

  const setReduceTransparency = useCallback((reduce: boolean) => {
    window.localStorage.setItem(TRANSPARENCY_KEY, String(reduce))
    setReduceTransparencyState(reduce)
  }, [])
  const setWallpaperSeed = useCallback((nextSeed: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(nextSeed)) return
    window.localStorage.setItem(THEME_SEED_KEY, nextSeed)
    setSeedState(nextSeed.toLowerCase())
  }, [])

  const resetTheme = useCallback(() => {
    window.localStorage.removeItem(THEME_MODE_KEY)
    window.localStorage.removeItem(THEME_SEED_KEY)
    window.localStorage.removeItem(TRANSPARENCY_KEY)
    window.localStorage.removeItem('usecloudos-manual-seed')
    setModeState('dark')
    setSeedState(DEFAULT_SEED)
    setReduceTransparencyState(false)
    setWallpaperThemeEnabled(false)
  }, [setWallpaperThemeEnabled])

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      seed,
      reduceTransparency,
      wallpaperThemeEnabled,
      setWallpaperThemeEnabled,
      setMode,
      setSeed,
      setWallpaperSeed,
      setReduceTransparency,
      resetTheme,
    }),
    [
      mode,
      resolvedMode,
      seed,
      reduceTransparency,
      wallpaperThemeEnabled,
      setWallpaperThemeEnabled,
      setMode,
      setSeed,
      setWallpaperSeed,
      setReduceTransparency,
      resetTheme,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
