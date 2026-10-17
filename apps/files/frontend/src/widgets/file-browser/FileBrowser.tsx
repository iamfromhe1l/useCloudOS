import { usePermission } from '@usecloud/app-sdk/react'
import { EmptyState, ErrorState, LoadingState, PillButton } from '@usecloud/ui'
import { SegmentedControl, Switch } from '@usecloud/ui/selection'
import { useState } from 'react'

import { formatBytes, useEntries, useStorageRoot } from '@/entities/file-entry'
import { CreateFolder } from '@/features/create-folder'
import { UploadFile } from '@/features/upload-file'

import { Breadcrumbs } from './Breadcrumbs'
import { FileList } from './FileList'
export function FileBrowser({ portal }: { portal: HTMLElement }) {
  const [path, setPath] = useState('')
  const [sort, setSort] = useState('name')
  const [hidden, setHidden] = useState(false)
  const [offset, setOffset] = useState(0)
  const root = useStorageRoot()
  const entries = useEntries(path, sort, hidden, offset)
  const canRead = usePermission('storage.shared.read')
  const canWrite = usePermission('storage.shared.write')
  const writable = canWrite && !!root.data?.writable
  function navigate(value: string) {
    setPath(value)
    setOffset(0)
  }
  if (!canRead)
    return (
      <ErrorState message="Shared storage permission is required. Ask an administrator to review Files permissions." />
    )
  const total = entries.data?.total ?? 0
  return (
    <div className="min-w-0 space-y-4 p-3 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <Breadcrumbs path={path} navigate={navigate} />
        <div className="flex flex-wrap gap-2">
          <CreateFolder path={path} disabled={!writable} portal={portal} />
          <UploadFile path={path} disabled={!writable} max={root.data?.maxUploadBytes ?? 0} />
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          label="Sort files"
          value={sort}
          options={[
            { value: 'name', label: 'Name' },
            { value: 'modified', label: 'Modified' },
            { value: 'size', label: 'Size' },
            { value: 'type', label: 'Type' },
          ]}
          onChange={(value) => {
            setSort(value)
            setOffset(0)
          }}
        />
        <span className="flex items-center gap-2 text-body-small">
          Show hidden files
          <Switch
            label="Show hidden files"
            checked={hidden}
            onCheckedChange={(value) => {
              setHidden(value)
              setOffset(0)
            }}
          />
        </span>
      </div>
      {!writable && root.data && (
        <p role="status" className="text-body-small text-on-surface-variant">
          Read-only storage. Write permission is required to change files.
        </p>
      )}
      {root.isError && <ErrorState message={root.error.message} />}
      {entries.isPending && <LoadingState message="Reading folder..." />}
      {entries.isError && (
        <ErrorState
          message={entries.error.message}
          action={<PillButton onClick={() => entries.refetch()}>Retry</PillButton>}
        />
      )}
      {entries.data && entries.data.entries.length === 0 && (
        <EmptyState
          title="No files here"
          message="Upload a file or create a folder to get started."
        />
      )}
      {entries.data && entries.data.entries.length > 0 && (
        <FileList
          entries={entries.data.entries}
          navigate={navigate}
          writable={writable}
          portal={portal}
        />
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3 text-body-small text-on-surface-variant">
        <p role="status">
          {total} entries
          {root.data ? ' · ' + formatBytes(root.data.availableBytes) + ' available' : ''}
        </p>
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
      </footer>
    </div>
  )
}
