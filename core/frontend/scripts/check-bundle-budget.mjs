import { readFile, readdir, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import path from 'node:path'

const dist = new URL('../dist/', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('.vite/manifest.json', dist), 'utf8'))
const entries = Object.values(manifest)
const entry = entries.find((item) => item.isEntry)

if (!entry) throw new Error('Vite manifest has no entry chunk')

async function gzipBytes(relativePath) {
  return gzipSync(await readFile(new URL(relativePath, dist))).byteLength
}

function collectInitial(item, files = new Set()) {
  files.add(item.file)
  for (const css of item.css ?? []) files.add(css)
  for (const importedKey of item.imports ?? []) collectInitial(manifest[importedKey], files)
  return files
}

const initialFiles = [...collectInitial(entry)]
const initialJS = initialFiles.filter((file) => file.endsWith('.js'))
const initialCSS = initialFiles.filter((file) => file.endsWith('.css'))
const assetDirectory = new URL('assets/', dist)
const assetNames = await readdir(assetDirectory)
const fontStats = await Promise.all(
  assetNames
    .filter((name) => name.endsWith('.woff2'))
    .map(async (name) => ({ name, bytes: (await stat(new URL(name, assetDirectory))).size })),
)
const largestFontByFamily = ['roboto-flex', 'jetbrains-mono'].map((family) =>
  Math.max(
    0,
    ...fontStats.filter((font) => font.name.startsWith(family)).map((font) => font.bytes),
  ),
)

const totals = {
  initialJS: (await Promise.all(initialJS.map(gzipBytes))).reduce((sum, bytes) => sum + bytes, 0),
  initialCSS: (await Promise.all(initialCSS.map(gzipBytes))).reduce((sum, bytes) => sum + bytes, 0),
  localeFonts: largestFontByFamily.reduce((sum, bytes) => sum + bytes, 0),
}

const limits = {
  initialJS: 150 * 1024,
  initialCSS: 40 * 1024,
  localeFonts: 150 * 1024,
}

for (const file of assetNames.filter((name) => name.endsWith('.js'))) {
  const bytes = await gzipBytes(path.posix.join('assets', file))
  if (bytes > 200 * 1024) throw new Error(`${file} exceeds the 200 KiB gzip chunk budget`)
}

for (const [name, bytes] of Object.entries(totals)) {
  const kib = (bytes / 1024).toFixed(1)
  const limitKib = (limits[name] / 1024).toFixed(0)
  console.log(`${name}: ${kib} KiB gzip/transfer budget ${limitKib} KiB`)
  if (bytes > limits[name]) throw new Error(`${name} exceeds its bundle budget`)
}
