import { PillButton, Tooltip } from '@usecloud/ui'
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
    <ul
      aria-label="Files and folders"
      className="divide-y divide-outline-variant rounded-shape-medium border border-outline-variant"
    >
      {entries.map((entry) => (
        <li key={entry.path} className="flex min-w-0 items-center gap-3 p-3">
          <FileIcon name={entry.name} directory={entry.kind === 'directory'} />
          <div className="min-w-0 flex-1">
            <Tooltip label={entry.name}>
              <span className="block min-w-0">
                {entry.kind === 'directory' ? (
                  <PillButton
                    tone="quiet"
                    onClick={() => navigate(entry.path)}
                    className="max-w-full justify-start px-0"
                  >
                    <span className="truncate">{entry.name}</span>
                  </PillButton>
                ) : entry.kind === 'file' ? (
                  <PillButton
                    tone={selected === entry.path ? 'primary' : 'quiet'}
                    aria-pressed={selected === entry.path}
                    onClick={() => setSelected(entry.path)}
                    className="max-w-full justify-start"
                  >
                    <span className="truncate">{entry.name}</span>
                  </PillButton>
                ) : (
                  <span className="block truncate py-2 text-body-medium">{entry.name}</span>
                )}
              </span>
            </Tooltip>
            <p className="truncate text-body-small text-on-surface-variant">
              {entry.kind === 'file' ? formatBytes(entry.size) : entry.kind} ·{' '}
              {new Date(entry.modifiedAt).toLocaleString()}
            </p>
          </div>
          <EntryActions
            entry={entry}
            open={() => navigate(entry.path)}
            writable={writable}
            portal={portal}
          />
        </li>
      ))}
    </ul>
  )
}
