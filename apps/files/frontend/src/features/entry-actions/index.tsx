import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon, PillButton } from '@usecloud/ui'
import {
  ContextMenu,
  ContextMenuContent,
  DropdownMenu,
  MenuContent,
  menuItemClass,
  menuSeparatorClass,
} from '@usecloud/ui/overlays'
import { type ReactElement, type ReactNode, useRef, useState } from 'react'

import { type FileEntry, fileKeys } from '@/entities/file-entry'
import { api, contentURL } from '@/shared/api'

import { FileOperationDialog, type Operation } from './FileOperationDialog'
export function EntryActions({
  entry,
  open,
  writable,
  portal,
  children,
}: {
  entry: FileEntry
  open: () => void
  writable: boolean
  portal: HTMLElement
  children: (menu: ReactNode) => ReactElement
}) {
  const [operation, setOperation] = useState<Operation | null>(null)
  const [target, setTarget] = useState('')
  const actionButton = useRef<HTMLButtonElement>(null)
  const dialogRequested = useRef(false)
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
      return api.request<void>('/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: entry.path,
          target: operation === 'rename' ? directory + target : target,
        }),
      })
    },
    onSuccess: async () => {
      setOperation(null)
      await client.invalidateQueries({ queryKey: fileKeys.all })
    },
  })
  function choose(value: Operation) {
    dialogRequested.current = true
    mutation.reset()
    setTarget(value === 'rename' ? entry.name : entry.path)
    setOperation(value)
  }
  const items = (context: boolean) => {
    const Primitive = context ? ContextMenu : DropdownMenu
    return (
      <>
        <Primitive.Label className="max-w-64 truncate px-3 py-2 text-label-medium text-on-surface-variant">
          {entry.name}
        </Primitive.Label>
        {entry.kind === 'directory' && (
          <Primitive.Item className={menuItemClass} onSelect={open}>
            Open folder
          </Primitive.Item>
        )}
        {entry.kind === 'file' && (
          <Primitive.Item asChild>
            <a href={contentURL(entry.path)} download className={menuItemClass}>
              Download
            </a>
          </Primitive.Item>
        )}
        <Primitive.Separator className={menuSeparatorClass} />
        {(['rename', 'move', 'delete'] as const).map((value) => (
          <Primitive.Item
            key={value}
            disabled={!writable}
            className={menuItemClass + (value === 'delete' ? ' text-error' : '')}
            onSelect={() => choose(value)}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Primitive.Item>
        ))}
      </>
    )
  }
  const dropdown = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <PillButton
          ref={actionButton}
          iconOnly
          tone="quiet"
          aria-label={'Actions for ' + entry.name}
        >
          <Icon name="moreHoriz" className="size-5" />
        </PillButton>
      </DropdownMenu.Trigger>
      <MenuContent
        align="end"
        onCloseAutoFocus={(event) => {
          if (dialogRequested.current) event.preventDefault()
        }}
      >
        {items(false)}
      </MenuContent>
    </DropdownMenu.Root>
  )
  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>{children(dropdown)}</ContextMenu.Trigger>
        <ContextMenuContent>{items(true)}</ContextMenuContent>
      </ContextMenu.Root>
      <FileOperationDialog
        operation={operation}
        close={() => setOperation(null)}
        entry={entry}
        portal={portal}
        target={target}
        setTarget={setTarget}
        pending={mutation.isPending}
        error={mutation.error?.message}
        confirm={() => mutation.mutate()}
        returnFocus={() => {
          dialogRequested.current = false
          actionButton.current?.focus()
        }}
      />
    </>
  )
}
