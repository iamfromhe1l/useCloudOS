import { readPalette, savePalette } from './cache.js'
export type ThemeMode = 'dark' | 'light' | 'system'
export type ResolvedThemeMode = Exclude<ThemeMode, 'system'>

export const DEFAULT_SEED = '#a7c957'
export const THEME_MODE_KEY = 'usecloudos-theme-mode'
export const THEME_SEED_KEY = 'usecloudos-theme-seed'
const CACHE_PREFIX = 'usecloudos-theme-v2'

const roleNames = {
  primary: 'primary',
  onPrimary: 'on-primary',
  primaryContainer: 'primary-container',
  onPrimaryContainer: 'on-primary-container',
  secondary: 'secondary',
  onSecondary: 'on-secondary',
  secondaryContainer: 'secondary-container',
  onSecondaryContainer: 'on-secondary-container',
  tertiary: 'tertiary',
  onTertiary: 'on-tertiary',
  tertiaryContainer: 'tertiary-container',
  onTertiaryContainer: 'on-tertiary-container',
  error: 'error',
  onError: 'on-error',
  errorContainer: 'error-container',
  onErrorContainer: 'on-error-container',
  surface: 'surface',
  onSurface: 'on-surface',
  surfaceVariant: 'surface-variant',
  onSurfaceVariant: 'on-surface-variant',
  surfaceDim: 'surface-dim',
  surfaceBright: 'surface-bright',
  surfaceContainerLowest: 'surface-container-lowest',
  surfaceContainerLow: 'surface-container-low',
  surfaceContainer: 'surface-container',
  surfaceContainerHigh: 'surface-container-high',
  surfaceContainerHighest: 'surface-container-highest',
  outline: 'outline',
  outlineVariant: 'outline-variant',
  inverseSurface: 'inverse-surface',
  inverseOnSurface: 'inverse-on-surface',
  inversePrimary: 'inverse-primary',
  scrim: 'scrim',
  shadow: 'shadow',
} as const

const semanticSeeds = {
  success: '#55b978',
  warning: '#e8ad48',
  info: '#5aa9e6',
} as const

export type ThemeVariables = Record<string, string>

function normalizeSeed(seed: string) {
  return /^#[0-9a-f]{6}$/i.test(seed) ? seed.toLowerCase() : DEFAULT_SEED
}

type MaterialColorUtilities = typeof import('@material/material-color-utilities')

async function loadMaterialColorUtilities() {
  return import('@material/material-color-utilities')
}

function schemeValues(utilities: MaterialColorUtilities, seed: string, mode: ResolvedThemeMode) {
  const scheme = new utilities.SchemeTonalSpot(
    utilities.Hct.fromInt(utilities.argbFromHex(seed)),
    mode === 'dark',
    0,
  )
  return Object.fromEntries(
    Object.keys(roleNames).map((role) => [role, scheme[role as keyof typeof roleNames]]),
  )
}

function semanticVariables(
  utilities: MaterialColorUtilities,
  sourceSeed: string,
  mode: ResolvedThemeMode,
  name: keyof typeof semanticSeeds,
) {
  const harmonized = utilities.Blend.harmonize(
    utilities.argbFromHex(semanticSeeds[name]),
    utilities.argbFromHex(sourceSeed),
  )
  const scheme = new utilities.SchemeTonalSpot(
    utilities.Hct.fromInt(harmonized),
    mode === 'dark',
    0,
  )
  return {
    [`--uc-${name}`]: utilities.hexFromArgb(scheme.primary),
    [`--uc-on-${name}`]: utilities.hexFromArgb(scheme.onPrimary),
    [`--uc-${name}-container`]: utilities.hexFromArgb(scheme.primaryContainer),
    [`--uc-on-${name}-container`]: utilities.hexFromArgb(scheme.onPrimaryContainer),
  }
}

export async function createThemeVariables(
  rawSeed: string,
  mode: ResolvedThemeMode,
): Promise<ThemeVariables> {
  const seed = normalizeSeed(rawSeed)
  const cacheKey = `${CACHE_PREFIX}:${mode}:${seed}`
  const cached = readPalette(cacheKey)
  if (cached) return cached

  const utilities = await loadMaterialColorUtilities()
  const values = schemeValues(utilities, seed, mode)
  const variables: ThemeVariables = {}
  for (const [sourceName, cssName] of Object.entries(roleNames)) {
    const color = values[sourceName]
    if (typeof color === 'number') variables[`--uc-${cssName}`] = utilities.hexFromArgb(color)
  }

  Object.assign(
    variables,
    semanticVariables(utilities, seed, mode, 'success'),
    semanticVariables(utilities, seed, mode, 'warning'),
    semanticVariables(utilities, seed, mode, 'info'),
  )

  savePalette(cacheKey, variables)
  return variables
}

export function applyThemeVariables(
  element: HTMLElement,
  variables: ThemeVariables,
  mode: ResolvedThemeMode,
  seed: string,
) {
  element.dataset.theme = mode
  element.dataset.themeSeed = normalizeSeed(seed)
  element.style.colorScheme = mode
  for (const [name, value] of Object.entries(variables)) {
    element.style.setProperty(name, value)
  }
}

export function resolveThemeMode(mode: ThemeMode): ResolvedThemeMode {
  if (mode !== 'system') return mode
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}
