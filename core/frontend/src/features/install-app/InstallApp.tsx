import * as Dialog from '@radix-ui/react-dialog'
import { type PackageMetadata, permissionMetadata } from '@usecloud/manifest'
import { useRef, useState } from 'react'

import {
  inspectPackage,
  TrustBadge,
  useApplicationRegistry,
  useAppMutation,
} from '@/entities/application'
import { ErrorState, PillButton } from '@/shared/ui'
export function InstallApp({ candidate }: { candidate?: PackageMetadata }) {
  const input = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<PackageMetadata | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [inspecting, setInspecting] = useState(false)
  const mutation = useAppMutation()
  const registry = useApplicationRegistry()
  const previous = registry.data?.applications.find(
    (app) => app.manifest.metadata.id === selected?.manifest.metadata.id,
  )
  const updating =
    !!selected &&
    registry.data?.applications.some(
      (app) => app.manifest.metadata.id === selected.manifest.metadata.id,
    )
  async function inspect(value: File) {
    setError('')
    setInspecting(true)
    try {
      setSelected(await inspectPackage(value))
      setFile(value)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Package validation failed')
    } finally {
      setInspecting(false)
    }
  }
  const install = () => {
    if (!selected) return
    const path = file
      ? '/api/v1/apps/' + (updating ? 'update' : 'install') + '?confirm=1'
      : '/api/v1/catalog/' +
        selected.manifest.metadata.id +
        (updating ? '/update' : '/install') +
        '?confirm=1'
    mutation.mutate(
      { path, method: 'POST', body: file ?? undefined },
      {
        onSuccess: () => {
          setSelected(null)
          setFile(null)
        },
      },
    )
  }
  return (
    <div className="relative">
      <input
        ref={input}
        type="file"
        accept=".usecloud"
        aria-label="Select application package"
        className="sr-only top-0 left-0"
        onChange={(e) => {
          const value = e.target.files?.[0]
          if (value) void inspect(value)
          e.target.value = ''
        }}
      />
      <PillButton
        disabled={inspecting}
        onClick={() => (candidate ? setSelected(candidate) : input.current?.click())}
      >
        {candidate ? 'Install' : 'Install from .usecloud file'}
      </PillButton>
      {error && <ErrorState message={error} />}
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) {
            setSelected(null)
            setFile(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim/60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[80dvh] w-[min(90vw,560px)] -translate-x-1/2 -translate-y-1/2 space-y-4 overflow-auto rounded-shape-large border border-outline-variant bg-surface-container-high p-6 text-on-surface">
            <Dialog.Title className="text-title-large font-semibold">
              {updating ? 'Update' : 'Install'} {selected?.manifest.metadata.name}
            </Dialog.Title>
            <Dialog.Description className="text-body-medium">
              Review this application's trust and requested access before installing.
            </Dialog.Description>
            {selected && (
              <TrustBadge trust={selected.trust} publisher={selected.signature?.publisherName} />
            )}
            <p className="text-body-small">
              Version {selected?.manifest.metadata.version} · {selected?.manifest.runtime.type}.
              {selected?.trust !== 'verified' &&
                ' This publisher is not trusted by your platform. Embedded/native code requires explicit development policy.'}
              {updating &&
                ' Review all changes before approving. Existing revoked permissions stay revoked; newly requested permissions require this approval.'}
            </p>
            {selected?.signature && (
              <details className="text-body-small">
                <summary>Publisher and integrity details</summary>
                <p>{selected.signature.publisherId}</p>
                <p className="text-mono-small break-all">{selected.signature.keyId}</p>
              </details>
            )}
            <ul className="space-y-2">
              {selected?.manifest.permissions.map((p) => (
                <li key={p} className="space-y-1">
                  <p>
                    {permissionMetadata[p].title}
                    {previous && !previous.manifest.permissions.includes(p) && ' — NEW access'}{' '}
                    <span className="text-body-small text-on-surface-variant">
                      ({permissionMetadata[p].risk} risk)
                    </span>
                  </p>
                  <details className="text-body-small">
                    <summary>Technical identifier</summary>
                    {p}
                  </details>
                </li>
              ))}
            </ul>
            {mutation.isError && <ErrorState message={mutation.error.message} />}
            <div className="flex flex-wrap gap-2">
              <PillButton onClick={install} disabled={mutation.isPending}>
                {mutation.isPending
                  ? 'Applying package...'
                  : 'Confirm and grant requested permissions'}
              </PillButton>
              <Dialog.Close asChild>
                <PillButton disabled={mutation.isPending} tone="quiet">
                  Cancel
                </PillButton>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
