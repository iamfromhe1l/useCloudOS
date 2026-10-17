import { usePermission } from '@usecloud/app-sdk/react'
import { EmptyState, ErrorState, Icon, PillButton, Skeleton } from '@usecloud/ui'
import { useState } from 'react'

import { formatBytes, useEntries, useStorageRoot } from '@/entities/file-entry'
import { CreateFolder } from '@/features/create-folder'
import { UploadFile } from '@/features/upload-file'

import { Breadcrumbs } from './Breadcrumbs'
import { FileList } from './FileList'
import { FileViewMenu } from './FileViewMenu'

export function FileBrowser({ portal }: { portal: HTMLElement }) {
  const [path, setPath] = useState('')
  const [sort, setSort] = useState('name')
  const [hidden, setHidden] = useState(false)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const root = useStorageRoot()
  const entries = useEntries(path, sort, hidden, offset)
  const canRead = usePermission('storage.shared.read')
  const canWrite = usePermission('storage.shared.write')
  const writable = canWrite && !!root.data?.writable
  function navigate(value: string) {
    setPath(value)
    setOffset(0)
    setSearch('')
  }
  if (!canRead)
    return (
      <ErrorState message="Shared storage permission is required. Ask an administrator to review Files permissions." />
    )
  const total = entries.data?.total ?? 0
  const visible =
    entries.data?.entries.filter((entry) =>
      entry.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    ) ?? []
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-surface-container-low">
      <header className="shrink-0 space-y-2 border-b border-outline-variant bg-surface-container-low px-3 py-2 sm:px-5 lg:flex lg:items-center lg:gap-4 lg:space-y-0">
        <div className="min-w-0 lg:flex-1">
          <Breadcrumbs path={path} navigate={navigate} />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          <label className="flex min-h-11 min-w-36 basis-full items-center gap-2 rounded-shape-medium bg-surface-container-high px-3 sm:flex-1 sm:basis-auto lg:w-56 lg:flex-none">
            <Icon name="search" className="size-5 shrink-0 text-on-surface-variant" />
            <input
              aria-label="Filter loaded files"
              placeholder="Filter loaded files"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-0 bg-transparent text-body-medium outline-none"
            />
          </label>
          <CreateFolder path={path} disabled={!writable} portal={portal} />
          <UploadFile path={path} disabled={!writable} max={root.data?.maxUploadBytes ?? 0} />
          <FileViewMenu
            sort={sort}
            setSort={(value) => {
              setSort(value)
              setOffset(0)
            }}
            hidden={hidden}
            setHidden={(value) => {
              setHidden(value)
              setOffset(0)
            }}
          />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-3 sm:px-5" aria-busy={entries.isFetching}>
        {!writable && root.data && (
          <p role="status" className="py-3 text-body-small text-on-surface-variant">
            Read-only storage. Write permission is required to change files.
          </p>
        )}
        {root.isError && <ErrorState message={root.error.message} />}
        {entries.isPending && (
          <div role="status" aria-label="Reading folder" className="space-y-3 py-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-14 w-full" />
            ))}
          </div>
        )}
        {entries.isError && (
          <ErrorState
            message={entries.error.message}
            action={<PillButton onClick={() => entries.refetch()}>Retry</PillButton>}
          />
        )}
        {entries.data && visible.length === 0 && (
          <div className="py-12">
            <EmptyState
              title={search ? 'No matching files' : 'No files here'}
              message={
                search
                  ? 'Try another name in this loaded page.'
                  : 'Upload a file or create a folder to get started.'
              }
            />
          </div>
        )}
        {visible.length > 0 && (
          <FileList
            entries={visible}
            navigate={navigate}
            writable={writable && !entries.isPlaceholderData}
            portal={portal}
          />
        )}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-outline-variant bg-surface-container-low px-4 py-2 text-body-small text-on-surface-variant">
        <p role="status">
          {total} {total === 1 ? 'item' : 'items'}
          {root.data ? ' · ' + formatBytes(root.data.availableBytes) + ' available' : ''}
        </p>
        {total > 100 && (
          <div className="flex gap-2">
            <PillButton
              tone="quiet"
              disabled={offset === 0 || entries.isFetching}
              onClick={() => setOffset(Math.max(0, offset - 100))}
            >
              Previous
            </PillButton>
            <PillButton
              tone="quiet"
              disabled={offset + 100 >= total || entries.isFetching}
              onClick={() => setOffset(offset + 100)}
            >
              Next
            </PillButton>
          </div>
        )}
      </footer>
    </div>
  )
}
