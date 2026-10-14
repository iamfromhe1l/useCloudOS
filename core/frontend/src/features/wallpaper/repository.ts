export type WallpaperFit = 'fill' | 'fit'
export interface WallpaperRecord {
  kind: 'default' | 'image' | 'none'
  blob?: Blob
  name?: string
  seed?: string
  fit: WallpaperFit
}
const DATABASE = 'usecloudos-appearance'
const STORE = 'wallpaper'
export const defaultRecord: WallpaperRecord = { kind: 'default', fit: 'fill' }
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Wallpaper storage is unavailable.'))
  })
}
export async function loadWallpaper(): Promise<WallpaperRecord> {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE).objectStore(STORE).get('current')
      request.onsuccess = () =>
        resolve((request.result as WallpaperRecord | undefined) ?? defaultRecord)
      request.onerror = () => reject(new Error('Could not restore wallpaper.'))
    })
  } finally {
    database.close()
  }
}
export async function saveWallpaper(record: WallpaperRecord): Promise<void> {
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).put(record, 'current')
      transaction.oncomplete = () => resolve()
      transaction.onerror = () =>
        reject(new Error('Could not save wallpaper. Browser storage may be full.'))
      transaction.onabort = () =>
        reject(new Error('Wallpaper storage transaction was interrupted.'))
    })
  } finally {
    database.close()
  }
}
