import { Dialog } from '@usecloud/ui/overlays'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  AppIcon,
  type InstalledApplication,
  toApplication,
  TrustBadge,
  useApplicationRegistry,
  useAppMutation,
} from '@/entities/application'
import { formatBytes } from '@/shared/lib'
import { EmptyState, ErrorState, LoadingState, PillButton, StatusChip } from '@/shared/ui'

import { ApplicationPermissions } from './ApplicationPermissions'
export function InstalledApplications() {
  const query = useApplicationRegistry()
  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorState message="Application registry unavailable." />
  const apps = query.data?.applications ?? []
  if (!apps.length)
    return (
      <EmptyState
        title="No installed applications"
        message="Install optional applications from Store."
      />
    )
  return (
    <div className="space-y-4">
      {apps.map((app) => (
        <ApplicationManagement key={app.manifest.metadata.id} app={app} />
      ))}
    </div>
  )
}
function ApplicationManagement({ app }: { app: InstalledApplication }) {
  const m = app.manifest
  const mutation = useAppMutation()
  const [remove, setRemove] = useState(false)
  const [purge, setPurge] = useState(false)
  const action = (name: string) =>
    mutation.mutate({ path: '/api/v1/apps/' + m.metadata.id + '/' + name, method: 'POST' })
  return (
    <section className="space-y-3 rounded-shape-medium bg-surface-container-high p-4">
      <div className="flex flex-wrap items-center gap-3">
        <AppIcon application={toApplication(app)} />
        <h3 className="text-title-medium font-semibold">{m.metadata.name}</h3>
        <StatusChip tone={app.status === 'failed' ? 'error' : 'neutral'}>{app.status}</StatusChip>
        <span className="text-body-small">
          {m.metadata.version} · {m.runtime.type}
        </span>
      </div>
      <p className="text-body-small">
        By {m.metadata.author}. Application data is retained separately from the package.
      </p>
      <TrustBadge trust={app.trust} publisher={app.publisherName} revoked={app.publisherRevoked} />
      <details className="space-y-3">
        <summary className="cursor-pointer text-label-large">
          Application details and permissions
        </summary>
        <p className="text-body-small">
          Runtime: {m.runtime.type}.{' '}
          {m.backend ? 'Native service supervised by systemd.' : 'No native backend service.'}
        </p>
        <p className="text-body-small">
          Data: retained independently of the package. Shared storage is never removed by uninstall.
        </p>
        <p className="text-body-small">
          Package size:{' '}
          {app.packageBytes ? formatBytes(app.packageBytes) : 'Not measured for this installation'}.
          Application-data usage is not tracked yet.
        </p>
        <ApplicationPermissions app={app} />
        <Link to="/store" className="text-primary underline">
          Check available updates in Store
        </Link>
      </details>
      <div className="flex flex-wrap items-center gap-2">
        <Link to={'/apps/' + m.metadata.id} className="text-primary underline">
          Open
        </Link>
        {(m.backend || m.runtime.type === 'container') && (
          <>
            <PillButton disabled={mutation.isPending} onClick={() => action('restart')}>
              Restart
            </PillButton>
            <PillButton
              disabled={mutation.isPending}
              onClick={() => action(app.status === 'running' ? 'stop' : 'start')}
            >
              {app.status === 'running' ? 'Stop' : 'Start'}
            </PillButton>
          </>
        )}
        <PillButton tone="danger" onClick={() => setRemove(true)} disabled={mutation.isPending}>
          Uninstall
        </PillButton>
      </div>
      {mutation.isError && <ErrorState message={mutation.error.message} />}
      <Dialog.Root open={remove} onOpenChange={setRemove}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim/60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,480px)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-shape-large bg-surface-container-high p-6 text-on-surface">
            <Dialog.Title className="text-title-large">Remove {m.metadata.name}?</Dialog.Title>
            <Dialog.Description>
              The application service and package will be removed. Data is kept unless you
              explicitly choose deletion.
            </Dialog.Description>
            <label className="flex gap-2">
              <input type="checkbox" checked={purge} onChange={(e) => setPurge(e.target.checked)} />
              Also permanently delete application data
            </label>
            <div className="flex gap-2">
              <PillButton
                tone="danger"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate(
                    {
                      path:
                        '/api/v1/apps/' +
                        m.metadata.id +
                        '?confirm=1' +
                        (purge ? '&purgeData=1' : ''),
                      method: 'DELETE',
                    },
                    { onSuccess: () => setRemove(false) },
                  )
                }
              >
                Confirm removal
              </PillButton>
              <Dialog.Close asChild>
                <PillButton tone="quiet">Cancel</PillButton>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
