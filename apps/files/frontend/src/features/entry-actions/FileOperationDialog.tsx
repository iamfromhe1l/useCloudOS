import { ErrorState, PillButton, Spinner, TextField } from '@usecloud/ui'
import { Dialog } from '@usecloud/ui/overlays'
import { AlertDialog } from '@usecloud/ui/overlays'
import { useRef } from 'react'

import type { FileEntry } from '@/entities/file-entry'

export type Operation = 'rename' | 'move' | 'delete'
interface Props {
  operation: Operation | null
  close: () => void
  entry: FileEntry
  portal: HTMLElement
  target: string
  setTarget: (value: string) => void
  pending: boolean
  error?: string
  confirm: () => void
  returnFocus: () => void
}
const contentClass =
  'fixed top-1/2 left-1/2 z-100 w-[min(90vw,480px)] -translate-x-1/2 -translate-y-1/2 space-y-5 rounded-shape-extra-large border border-outline-variant bg-surface-container-high p-6 text-on-surface'
export function FileOperationDialog({
  operation,
  close,
  entry,
  portal,
  target,
  setTarget,
  pending,
  error,
  confirm,
  returnFocus,
}: Props) {
  const cancel = useRef<HTMLButtonElement>(null)
  const onOpenChange = (open: boolean) => {
    if (!open && !pending) close()
  }
  if (operation === 'delete')
    return (
      <AlertDialog.Root open onOpenChange={onOpenChange}>
        <AlertDialog.Portal container={portal}>
          <AlertDialog.Overlay className="fixed inset-0 z-90 bg-scrim/60" />
          <AlertDialog.Content
            aria-modal="true"
            className={contentClass}
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              cancel.current?.focus()
            }}
            onCloseAutoFocus={returnFocus}
          >
            <AlertDialog.Title className="text-title-large font-semibold">
              Delete entry
            </AlertDialog.Title>
            <AlertDialog.Description className="text-body-medium break-words">
              Deletion is permanent.{' '}
              {entry.kind === 'directory'
                ? 'This folder and all its contents will be removed.'
                : 'This file will be removed.'}{' '}
              <strong>{entry.name}</strong>
            </AlertDialog.Description>
            {error && <ErrorState message={error} />}
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <PillButton ref={cancel} tone="quiet" disabled={pending}>
                  Cancel
                </PillButton>
              </AlertDialog.Cancel>
              <PillButton tone="danger" onClick={confirm} disabled={pending}>
                {pending && <Spinner />}Confirm
              </PillButton>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    )
  return (
    <Dialog.Root open={operation !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal container={portal}>
        <Dialog.Overlay className="fixed inset-0 z-90 bg-scrim/60" />
        <Dialog.Content aria-modal="true" className={contentClass} onCloseAutoFocus={returnFocus}>
          <Dialog.Title className="text-title-large font-semibold">
            {operation === 'rename' ? 'Rename entry' : 'Move entry'}
          </Dialog.Title>
          <Dialog.Description className="text-body-small break-words">
            {operation === 'rename'
              ? 'Choose a new name for'
              : 'Enter a destination relative to Shared storage for'}{' '}
            {entry.name}.
          </Dialog.Description>
          <TextField
            label={operation === 'rename' ? 'New name' : 'Destination path'}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            maxLength={4096}
          />
          {error && <ErrorState message={error} />}
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <PillButton ref={cancel} tone="quiet" disabled={pending}>
                Cancel
              </PillButton>
            </Dialog.Close>
            <PillButton tone="primary" onClick={confirm} disabled={pending || !target.trim()}>
              {pending && <Spinner />}Confirm
            </PillButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
