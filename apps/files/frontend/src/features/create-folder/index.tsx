import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ErrorState, PillButton } from '@usecloud/ui'
import { Dialog } from '@usecloud/ui/overlays'
import { useState } from 'react'

import { fileKeys } from '@/entities/file-entry'
import { api } from '@/shared/api'
export function CreateFolder({
  path,
  disabled,
  portal,
}: {
  path: string
  disabled: boolean
  portal: HTMLElement
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: () =>
      api.request('/directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: [path, name].filter(Boolean).join('/') }),
      }),
    onSuccess: async () => {
      setOpen(false)
      setName('')
      await client.invalidateQueries({ queryKey: fileKeys.all })
    },
  })
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <PillButton disabled={disabled} tone="quiet">
          New folder
        </PillButton>
      </Dialog.Trigger>
      <Dialog.Portal container={portal}>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim/60" />
        <Dialog.Content
          aria-modal="true"
          className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,440px)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-shape-large bg-surface-container-high p-5 text-on-surface"
        >
          <Dialog.Title className="text-title-large">Create folder</Dialog.Title>
          <Dialog.Description>
            Folder names cannot contain slashes. Existing entries are never overwritten.
          </Dialog.Description>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
            className="space-y-4"
          >
            <label className="block">
              Folder name
              <input
                value={name}
                maxLength={255}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-shape-small border border-outline bg-surface p-3 text-on-surface"
              />
            </label>
            {mutation.isError && <ErrorState message={mutation.error.message} />}
            <div className="flex gap-2">
              <PillButton disabled={!name || name.includes('/') || mutation.isPending}>
                Create
              </PillButton>
              <Dialog.Close asChild>
                <PillButton type="button" tone="quiet">
                  Cancel
                </PillButton>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
