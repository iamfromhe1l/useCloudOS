import {
  AppIcon,
  AppWindow,
  manifestIdentity,
  TrustBadge,
  useApplicationRegistry,
  useCatalog,
} from '@/entities/application'
import { InstallApp } from '@/features/install-app'
import { EmptyState, ErrorState, LoadingState, StatusChip } from '@/shared/ui'
export function StorePage() {
  const catalog = useCatalog()
  const registry = useApplicationRegistry()
  const installed = new Map(
    registry.data?.applications.map((app) => [
      app.manifest.metadata.id,
      app.manifest.metadata.version,
    ]),
  )
  return (
    <AppWindow appId="store">
      <div className="space-y-6 p-5">
        <InstallApp />
        {catalog.isPending && <LoadingState />}
        {catalog.isError && (
          <ErrorState message="Catalog unavailable. Installed applications remain usable." />
        )}
        {catalog.data && !catalog.data.applications.length && (
          <EmptyState
            title="Local catalog is empty"
            message="Build a development package or sideload a .usecloud file."
          />
        )}
        <div className="grid gap-4 medium:grid-cols-2">
          {catalog.data?.applications.map((p) => (
            <section
              key={p.manifest.metadata.id}
              className="min-w-0 space-y-3 rounded-shape-large bg-surface-container p-4 [overflow-wrap:anywhere]"
            >
              <div className="flex items-center gap-3">
                <AppIcon application={manifestIdentity(p.manifest)} />
                <h2 className="text-title-medium font-semibold">{p.manifest.metadata.name}</h2>
              </div>
              <p>{p.manifest.metadata.description}</p>
              <p className="text-body-small">
                {p.manifest.metadata.version} · {p.manifest.runtime.type} ·{' '}
                {p.manifest.metadata.author}
              </p>
              <TrustBadge trust={p.trust} publisher={p.signature?.publisherName} />
              {installed.get(p.manifest.metadata.id) === p.manifest.metadata.version ? (
                <StatusChip tone="success">Installed</StatusChip>
              ) : (
                <InstallApp candidate={p} />
              )}
            </section>
          ))}
        </div>
      </div>
    </AppWindow>
  )
}
