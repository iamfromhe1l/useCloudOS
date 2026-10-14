import * as Dialog from '@radix-ui/react-dialog'
import { type PackageMetadata, permissionDescriptions } from '@usecloud/manifest'
import { useRef, useState } from 'react'

import { inspectPackage, useAppMutation } from '@/entities/application'
import { ErrorState, PillButton, StatusChip } from '@/shared/ui'
export function InstallApp({ candidate }: { candidate?: PackageMetadata }) {
  const input = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<PackageMetadata | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [inspecting, setInspecting] = useState(false)
  const mutation = useAppMutation()
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
      ? '/api/v1/apps/install?confirm=1'
      : '/api/v1/catalog/' + selected.manifest.metadata.id + '/install?confirm=1'
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
    <div>
      <input
        ref={input}
        type="file"
        accept=".usecloud"
        aria-label="Select application package"
        className="sr-only"
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
              Install {selected?.manifest.metadata.name}
            </Dialog.Title>
            <Dialog.Description className="text-body-medium">
              Review this application's trust and requested access before installing.
            </Dialog.Description>
            <StatusChip tone="warning">{selected?.trust}</StatusChip>
            <p className="text-body-small">
              Unsigned packages have not been verified. Embedded/native code is accepted only by an
              explicit development trust policy. Do not install packages you do not trust.
            </p>
            <ul className="space-y-2">
              {selected?.manifest.permissions.map((p) => (
                <li key={p}>{permissionDescriptions[p]}</li>
              ))}
            </ul>
            {mutation.isError && <ErrorState message={mutation.error.message} />}
            <div className="flex flex-wrap gap-2">
              <PillButton onClick={install} disabled={mutation.isPending}>
                {mutation.isPending ? 'Installing...' : 'Confirm install and grant permissions'}
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
