import { AppWindow, useApplicationRegistry, useCatalog } from '@/entities/application'
import { InstallApp } from '@/features/install-app'
import { EmptyState, ErrorState, LoadingState, StatusChip } from '@/shared/ui'
export function StorePage() {
  const catalog = useCatalog()
  const registry = useApplicationRegistry()
  const installed = new Set(registry.data?.applications.map((app) => app.manifest.metadata.id))
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
              className="space-y-3 rounded-shape-large bg-surface-container p-4"
            >
              <h2 className="text-title-medium font-semibold">{p.manifest.metadata.name}</h2>
              <p>{p.manifest.metadata.description}</p>
              <p className="text-body-small">
                {p.manifest.metadata.version} · {p.trust}
              </p>
              {installed.has(p.manifest.metadata.id) ? (
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
