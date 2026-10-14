type Palette = Record<string, string>
const memory = new Map<string, Palette>()
const LIMIT = 24
export function readPalette(key: string): Palette | undefined {
  const cached = memory.get(key)
  if (cached) return cached
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return undefined
    const value: unknown = JSON.parse(stored)
    if (!value || typeof value !== 'object') return undefined
    const entries = Object.entries(value)
    if (
      entries.length < 32 ||
      !entries.every(
        ([name, color]) =>
          name.startsWith('--uc-') && typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color),
      )
    )
      return undefined
    const palette = value as Palette
    remember(key, palette)
    return palette
  } catch {
    return undefined
  }
}
function remember(key: string, palette: Palette) {
  memory.set(key, palette)
  if (memory.size > LIMIT) {
    const oldest = memory.keys().next().value
    if (oldest) memory.delete(oldest)
  }
}
export function savePalette(key: string, palette: Palette) {
  remember(key, palette)
  try {
    localStorage.setItem(key, JSON.stringify(palette))
    const keys = Object.keys(localStorage).filter(
      (item) => item.startsWith('usecloudos-theme-v2:') && item !== key,
    )
    for (const old of keys.slice(0, Math.max(0, keys.length + 1 - LIMIT)))
      localStorage.removeItem(old)
  } catch {
    /* Theme generation still works when optional cache storage is full. */
  }
}
