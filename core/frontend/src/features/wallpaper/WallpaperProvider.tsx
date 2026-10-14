import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import defaultUrl from '@/shared/assets/wallpaper.svg'
import { DEFAULT_SEED, useTheme } from '@/shared/config/theme'

import { extractWallpaperSeed, prepareWallpaper } from './image'
import {
  defaultRecord,
  loadWallpaper,
  saveWallpaper,
  type WallpaperFit,
  type WallpaperRecord,
} from './repository'
interface ContextValue {
  record: WallpaperRecord
  url: string | undefined
  busy: boolean
  error: string | undefined
  select: (file: File) => Promise<void>
  remove: () => Promise<void>
  reset: () => Promise<void>
  setFit: (fit: WallpaperFit) => Promise<void>
  setDynamicColors: (enabled: boolean) => Promise<void>
}
const Context = createContext<ContextValue | null>(null)
export function WallpaperProvider({ children }: PropsWithChildren) {
  const [record, setRecord] = useState<WallpaperRecord>(defaultRecord)
  const [url, setUrl] = useState<string | undefined>(defaultUrl)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string>()
  const { wallpaperThemeEnabled, setWallpaperThemeEnabled, setWallpaperSeed } = useTheme()
  const locked = useRef(true)
  useEffect(() => {
    let active = true
    void loadWallpaper()
      .then((stored) => {
        if (active) setRecord(stored)
      })
      .catch((cause: unknown) => {
        if (active) setError(message(cause))
      })
      .finally(() => {
        if (active) {
          locked.current = false
          setBusy(false)
        }
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    const objectUrl = record.blob ? URL.createObjectURL(record.blob) : undefined
    setUrl(record.kind === 'default' ? defaultUrl : objectUrl)
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [record.blob, record.kind])
  async function perform(task: () => Promise<void>) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError(undefined)
    try {
      await task()
    } catch (cause) {
      setError(message(cause))
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  async function commit(next: WallpaperRecord) {
    await saveWallpaper(next)
    setRecord(next)
  }
  const select = (file: File) =>
    perform(async () => {
      const blob = await prepareWallpaper(file)
      let seed: string | undefined
      if (wallpaperThemeEnabled) {
        try {
          seed = await extractWallpaperSeed(blob)
        } catch {
          setError('Wallpaper saved; color extraction failed. Your accent was kept.')
        }
      }
      const next: WallpaperRecord = {
        kind: 'image',
        blob,
        name: file.name,
        fit: record.fit,
        ...(seed ? { seed } : {}),
      }
      await commit(next)
      if (seed) setWallpaperSeed(seed)
    })
  const remove = () =>
    perform(async () => {
      await commit({ kind: 'none', fit: record.fit })
      setWallpaperThemeEnabled(false)
    })
  const reset = () =>
    perform(async () => {
      await commit(defaultRecord)
      if (wallpaperThemeEnabled) setWallpaperSeed(DEFAULT_SEED)
    })
  const setFit = (fit: WallpaperFit) => perform(() => commit({ ...record, fit }))
  const setDynamicColors = (enabled: boolean) =>
    perform(async () => {
      if (!enabled) {
        setWallpaperThemeEnabled(false)
        return
      }
      if (record.kind === 'none') throw new Error('Choose a wallpaper before using its colors.')
      const seed =
        record.seed ?? (record.blob ? await extractWallpaperSeed(record.blob) : DEFAULT_SEED)
      await commit({ ...record, seed })
      setWallpaperSeed(seed)
      setWallpaperThemeEnabled(true)
    })
  return (
    <Context.Provider
      value={{ record, url, busy, error, select, remove, reset, setFit, setDynamicColors }}
    >
      {children}
    </Context.Provider>
  )
}
function message(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Wallpaper could not be updated.'
}
export function useWallpaper() {
  const value = useContext(Context)
  if (!value) throw new Error('useWallpaper must be inside WallpaperProvider')
  return value
}
