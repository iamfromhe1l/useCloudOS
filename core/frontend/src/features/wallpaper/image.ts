const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
export function validateWallpaper(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Choose a PNG, JPEG, WebP, AVIF or GIF image.')
  if (file.size > MAX_SIZE) throw new Error('Wallpaper must be 10 MB or smaller.')
  if (file.size === 0) throw new Error('This image is empty.')
}
export async function decodeWallpaper(blob: Blob) {
  const bitmap = await createImageBitmap(blob)
  if (bitmap.width * bitmap.height > 24_000_000) {
    bitmap.close()
    throw new Error('Wallpaper must be 24 megapixels or smaller.')
  }
  return bitmap
}
export async function prepareWallpaper(file: File): Promise<Blob> {
  validateWallpaper(file)
  const bitmap = await decodeWallpaper(file)
  try {
    const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image processing is unavailable.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Image could not be saved.'))),
        'image/webp',
        0.88,
      )
    })
  } finally {
    bitmap.close()
  }
}
export async function extractWallpaperSeed(blob: Blob): Promise<string> {
  const bitmap = await decodeWallpaper(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 48
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Image color extraction is unavailable.')
    context.drawImage(bitmap, 0, 0, 48, 48)
    const { QuantizerCelebi, Score, argbFromRgb, hexFromArgb } =
      await import('@material/material-color-utilities')
    const data = context.getImageData(0, 0, 48, 48).data
    const pixels: number[] = []
    for (let index = 0; index < data.length; index += 4) {
      if ((data[index + 3] ?? 0) > 128)
        pixels.push(argbFromRgb(data[index] ?? 0, data[index + 1] ?? 0, data[index + 2] ?? 0))
    }
    const colors = Score.score(QuantizerCelebi.quantize(pixels, 32))
    const color = colors[0]
    if (color === undefined) throw new Error('Could not extract wallpaper colors.')
    return hexFromArgb(color)
  } finally {
    bitmap.close()
  }
}
