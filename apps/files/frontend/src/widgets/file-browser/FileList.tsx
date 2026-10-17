import { useState } from 'react'

import { type FileEntry, FileIcon, formatBytes } from '@/entities/file-entry'
import { EntryActions } from '@/features/entry-actions'

export function FileList({
  entries,
  navigate,
  writable,
  portal,
}: {
  entries: FileEntry[]
  navigate: (path: string) => void
  writable: boolean
  portal: HTMLElement
}) {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div className="min-w-0">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(0,1fr)_7rem_12rem_3rem] gap-4 border-b border-outline-variant px-3 py-3 text-label-medium text-on-surface-variant sm:grid"
      >
        <span>Name</span>
        <span>Size</span>
        <span>Modified</span>
        <span />
      </div>
      <ul aria-label="Files and folders" className="min-w-0 py-1">
        {entries.map((entry) => (
          <EntryActions
            key={entry.path}
            entry={entry}
            open={() => navigate(entry.path)}
            writable={writable}
            portal={portal}
          >
            {(menu) => (
              <li
                className="group flex min-w-0 items-center gap-2 rounded-shape-small border border-transparent px-2 hover:bg-surface-container data-[selected=true]:border-secondary/30 data-[selected=true]:bg-secondary-container data-[selected=true]:text-on-secondary-container"
                data-selected={selected === entry.path}
              >
                <button
                  aria-label={entry.name}
                  aria-pressed={selected === entry.path}
                  onClick={() => {
                    setSelected(entry.path)
                    if (entry.kind === 'directory') navigate(entry.path)
                  }}
                  className="grid min-h-16 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] items-center gap-x-4 text-left sm:min-h-14 sm:grid-cols-[minmax(0,1fr)_7rem_12rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-shape-small bg-surface-container-high text-primary">
                      <FileIcon name={entry.name} directory={entry.kind === 'directory'} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-body-medium" title={entry.name}>
                        {entry.name}
                      </span>
                      <span className="block text-body-small text-on-surface-variant sm:hidden">
                        {entry.kind === 'file' ? formatBytes(entry.size) : entry.kind}
                      </span>
                    </span>
                  </span>
                  <span className="hidden text-body-small text-on-surface-variant sm:block">
                    {entry.kind === 'file' ? formatBytes(entry.size) : '—'}
                  </span>
                  <time
                    dateTime={entry.modifiedAt}
                    title={new Date(entry.modifiedAt).toLocaleString()}
                    className="hidden text-body-small text-on-surface-variant sm:block"
                  >
                    {new Date(entry.modifiedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </button>
                {menu}
              </li>
            )}
          </EntryActions>
        ))}
      </ul>
    </div>
  )
}
