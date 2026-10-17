import { createUseCloudClient } from '@usecloud/app-sdk'
export const api = createUseCloudClient('files')
export function contentURL(path: string) {
  return '/api/apps/files/content?' + new URLSearchParams({ path })
}
export function uploadFile(path: string, file: File, progress: (value: number) => void) {
  const xhr = new XMLHttpRequest()
  const promise = new Promise<void>((resolve, reject) => {
    xhr.open('PUT', contentURL(path))
    xhr.withCredentials = true
    let updated = 0
    xhr.upload.onprogress = (event) => {
      const now = Date.now()
      if (event.lengthComputable && (now - updated > 200 || event.loaded === event.total)) {
        updated = now
        progress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else {
        let message = 'Upload failed'
        try {
          message = JSON.parse(xhr.responseText).error.message
        } catch {
          /* safe fallback */
        }
        reject(new Error(message))
      }
    }
    xhr.onerror = () => reject(new Error('Upload connection failed'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))
    xhr.send(file)
  })
  return { promise, cancel: () => xhr.abort() }
}
