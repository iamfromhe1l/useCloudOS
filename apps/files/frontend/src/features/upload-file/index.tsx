import { useQueryClient } from '@tanstack/react-query'
import { useAppContext } from '@usecloud/app-sdk/react'
import { ErrorState, PillButton } from '@usecloud/ui'
import { useEffect, useRef, useState } from 'react'

import { fileKeys } from '@/entities/file-entry'
import { uploadFile } from '@/shared/api'
export function UploadFile({
  path,
  disabled,
  max,
}: {
  path: string
  disabled: boolean
  max: number
}) {
  const input = useRef<HTMLInputElement>(null)
  const active = useRef<ReturnType<typeof uploadFile> | null>(null)
  const [state, setState] = useState<{ name: string; percent: number } | null>(null)
  const [error, setError] = useState('')
  const client = useQueryClient()
  const host = useAppContext()
  useEffect(() => () => active.current?.cancel(), [])
  async function select(file: File) {
    setError('')
    if (file.size > max) {
      setError('This file exceeds the server upload limit.')
      return
    }
    setState({ name: file.name, percent: 0 })
    const task = uploadFile([path, file.name].filter(Boolean).join('/'), file, (percent) =>
      setState({ name: file.name, percent }),
    )
    active.current = task
    try {
      await task.promise
      await client.invalidateQueries({ queryKey: fileKeys.all })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      if (host.permissions.includes('notifications.send'))
        void host.notifications
          .push('A Files upload did not complete. Check Files for details.')
          .catch(() => {})
    } finally {
      active.current = null
      setState(null)
    }
  }
  return (
    <div className="min-w-0 space-y-2">
      <input
        ref={input}
        type="file"
        aria-label="Choose file to upload"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void select(file)
          e.target.value = ''
        }}
      />
      <PillButton disabled={disabled || !!state} onClick={() => input.current?.click()}>
        Upload file
      </PillButton>
      {state && (
        <div role="status" className="space-y-2">
          <p className="truncate text-body-small" title={state.name}>
            {state.name} · {state.percent}%
          </p>
          <progress
            aria-label={'Uploading ' + state.name}
            value={state.percent}
            max={100}
            className="w-full accent-primary"
          />
          <PillButton tone="quiet" onClick={() => active.current?.cancel()}>
            Cancel upload
          </PillButton>
        </div>
      )}
      {error && <ErrorState message={error} />}
    </div>
  )
}
