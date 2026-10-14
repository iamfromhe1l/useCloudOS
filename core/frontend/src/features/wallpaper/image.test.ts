import { describe, expect, it } from 'vitest'

import { validateWallpaper } from './image'
describe('wallpaper validation', () => {
  it('accepts supported raster input', () =>
    expect(() =>
      validateWallpaper(new File(['image'], 'wallpaper.png', { type: 'image/png' })),
    ).not.toThrow())
  it('rejects unsupported MIME including active SVG', () =>
    expect(() =>
      validateWallpaper(new File(['<svg/>'], 'wallpaper.svg', { type: 'image/svg+xml' })),
    ).toThrow('Choose a PNG'))
  it('rejects empty images', () =>
    expect(() => validateWallpaper(new File([], 'wallpaper.png', { type: 'image/png' }))).toThrow(
      'empty',
    ))
  it('rejects oversized images', () =>
    expect(() =>
      validateWallpaper(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'wallpaper.png', { type: 'image/png' }),
      ),
    ).toThrow('10 MB'))
})
