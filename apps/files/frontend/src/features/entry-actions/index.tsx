import * as Dialog from '@radix-ui/react-dialog'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ErrorState, PillButton } from '@usecloud/ui'
import { useState } from 'react'

import { type FileEntry, fileKeys } from '@/entities/file-entry'
import { api, contentURL } from '@/shared/api'
type Operation = 'rename' | 'move' | 'delete'
export function EntryActions({
  entry,
  open,
  writable,
  portal,
}: {
  entry: FileEntry
  open: () => void
  writable: boolean
  portal: HTMLElement
}) {
  const [operation, setOperation] = useState<Operation | null>(null)
  const [target, setTarget] = useState('')
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      if (operation === 'delete')
        return api.request<void>(
          '/entries?' +
            new URLSearchParams({
              path: entry.path,
              recursive: entry.kind === 'directory' ? '1' : '0',
            }),
          { method: 'DELETE' },
        )
      const directory = entry.path.includes('/')
        ? entry.path.slice(0, entry.path.lastIndexOf('/') + 1)
        : ''
      const destination = operation === 'rename' ? directory + target : target
      return api.request<void>('/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: entry.path, target: destination }),
      })
    },
    onSuccess: async () => {
      setOperation(null)
      await client.invalidateQueries({ queryKey: fileKeys.all })
    },
  })
  function choose(value: Operation) {
    mutation.reset()
    setTarget(value === 'rename' ? entry.name : entry.path)
    setOperation(value)
  }
  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <PillButton tone="quiet" aria-label={'Actions for ' + entry.name}>
            Actions
          </PillButton>
        </Menu.Trigger>
        <Menu.Portal container={portal}>
          <Menu.Content
            sideOffset={4}
            className="z-50 min-w-44 rounded-shape-medium border border-outline-variant bg-surface-container-high p-2 text-on-surface shadow-lg"
          >
            {entry.kind === 'directory' && (
              <Menu.Item
                className="cursor-pointer rounded p-2 outline-none data-highlighted:bg-secondary-container"
                onSelect={open}
              >
                Open folder
              </Menu.Item>
            )}
            {entry.kind === 'file' && (
              <Menu.Item asChild>
                <a
                  className="block rounded p-2 outline-none data-highlighted:bg-secondary-container"
                  href={contentURL(entry.path)}
                  download
                >
                  Download
                </a>
              </Menu.Item>
            )}
            {(['rename', 'move', 'delete'] as const).map((value) => (
              <Menu.Item
                key={value}
                disabled={!writable}
                className="cursor-pointer rounded p-2 capitalize outline-none data-disabled:opacity-60 data-highlighted:bg-secondary-container"
                onSelect={() => choose(value)}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
      <Dialog.Root
        open={operation !== null}
        onOpenChange={(value) => {
          if (!value && !mutation.isPending) setOperation(null)
        }}
      >
        <Dialog.Portal container={portal}>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim/60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,480px)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-shape-large bg-surface-container-high p-5 text-on-surface">
            <Dialog.Title className="text-title-large capitalize">{operation} entry</Dialog.Title>
            <Dialog.Description className="text-body-small break-words">
              {operation === 'delete'
                ? 'Deletion is permanent. Folders and all their contents will be removed.'
                : 'Enter a name, or a destination path relative to Shared storage.'}{' '}
              <span>{entry.name}</span>
            </Dialog.Description>
            {operation !== 'delete' && (
              <label className="block">
                {operation === 'rename' ? 'New name' : 'Destination path'}
                <input
                  className="mt-2 w-full rounded-shape-small border border-outline bg-surface p-3 text-on-surface"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  maxLength={4096}
                />
              </label>
            )}
            {mutation.isError && <ErrorState message={mutation.error.message} />}
            <div className="flex gap-2">
              <PillButton
                tone={operation === 'delete' ? 'danger' : 'primary'}
                disabled={mutation.isPending || (operation !== 'delete' && !target.trim())}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Applying...' : 'Confirm'}
              </PillButton>
              <Dialog.Close asChild>
                <PillButton tone="quiet" disabled={mutation.isPending}>
                  Cancel
                </PillButton>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
