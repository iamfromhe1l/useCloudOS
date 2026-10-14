import { beforeEach, describe, expect, it } from 'vitest'

import { applyThemeVariables, createThemeVariables, DEFAULT_SEED, resolveThemeMode } from './theme'

describe('theme generation', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-seed')
  })

  it('creates and reuses the complete semantic role map', async () => {
    const first = await createThemeVariables(DEFAULT_SEED, 'dark')
    const second = await createThemeVariables(DEFAULT_SEED, 'dark')

    expect(second).toBe(first)
    expect(first).toMatchObject({
      '--uc-primary': expect.stringMatching(/^#[0-9a-f]{6}$/i),
      '--uc-on-primary': expect.stringMatching(/^#[0-9a-f]{6}$/i),
      '--uc-surface': expect.stringMatching(/^#[0-9a-f]{6}$/i),
      '--uc-surface-container-highest': expect.stringMatching(/^#[0-9a-f]{6}$/i),
      '--uc-outline-variant': expect.stringMatching(/^#[0-9a-f]{6}$/i),
      '--uc-success': expect.stringMatching(/^#[0-9a-f]{6}$/i),
      '--uc-warning': expect.stringMatching(/^#[0-9a-f]{6}$/i),
      '--uc-info': expect.stringMatching(/^#[0-9a-f]{6}$/i),
    })
  })

  it('applies normalized metadata and generated variables to the root', () => {
    applyThemeVariables(document.documentElement, { '--uc-primary': '#ffffff' }, 'light', 'invalid')

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.dataset.themeSeed).toBe(DEFAULT_SEED)
    expect(document.documentElement.style.getPropertyValue('--uc-primary')).toBe('#ffffff')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('resolves an explicit mode without consulting the operating system', () => {
    expect(resolveThemeMode('dark')).toBe('dark')
    expect(resolveThemeMode('light')).toBe('light')
  })
  it('derives distinct complete light surfaces instead of retaining dark fallback roles', async () => {
    const dark = await createThemeVariables(DEFAULT_SEED, 'dark')
    const light = await createThemeVariables(DEFAULT_SEED, 'light')
    for (const role of [
      'surface-container-lowest',
      'surface-container-low',
      'surface-container',
      'surface-container-high',
      'surface-container-highest',
    ]) {
      expect(light['--uc-' + role]).toMatch(/^#[0-9a-f]{6}$/i)
      expect(light['--uc-' + role]).not.toBe(dark['--uc-' + role])
    }
  })
})
