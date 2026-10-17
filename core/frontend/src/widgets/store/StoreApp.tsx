import { DropdownMenu, MenuContent, menuItemClass } from '@usecloud/ui/overlays'
import { useState } from 'react'

import { AppWindow, useCatalog } from '@/entities/application'
import { InstallApp } from '@/features/install-app'
import { EmptyState, ErrorState, Icon, PillButton, Skeleton } from '@/shared/ui'

import { CatalogCard } from './CatalogCard'
import { CatalogDetail } from './CatalogDetail'
export function StoreApp() {
  const catalog = useCatalog()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [sideload, setSideload] = useState(false)
  const apps = catalog.data?.applications ?? []
  const visible = apps.filter((a) =>
    (a.manifest.metadata.name + ' ' + a.manifest.metadata.description)
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  )
  const detail = apps.find((a) => a.manifest.metadata.id === selected)
  return (
    <AppWindow appId="store">
      {detail ? (
        <CatalogDetail candidate={detail} back={() => setSelected(null)} />
      ) : (
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
          <header className="flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <h2 className="text-title-large font-semibold">Discover your cloud</h2>
              <p className="mt-1 text-body-small text-on-surface-variant">
                Useful applications. Running on your terms.
              </p>
            </div>
            <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-full bg-surface-container-high px-4">
              <Icon name="search" className="size-5" />
              <input
                aria-label="Search applications"
                placeholder="Search applications"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 min-w-0 bg-transparent text-body-medium outline-none"
              />
            </label>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <PillButton iconOnly tone="quiet" aria-label="Store options">
                  <Icon name="moreHoriz" className="size-5" />
                </PillButton>
              </DropdownMenu.Trigger>
              <MenuContent align="end">
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => setSideload(!sideload)}
                >
                  Install from .usecloud file
                </DropdownMenu.Item>
              </MenuContent>
            </DropdownMenu.Root>
          </header>
          {sideload && (
            <section className="rounded-shape-medium border border-outline-variant p-4">
              <p className="mb-3 text-body-small text-on-surface-variant">
                Advanced: install a package from a publisher you trust.
              </p>
              <InstallApp />
            </section>
          )}
          {catalog.isPending && (
            <div role="status" aria-label="Loading catalog" className="space-y-4">
              <Skeleton className="h-64" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </div>
          )}
          {catalog.isError && (
            <ErrorState
              message="Catalog unavailable. Installed applications remain usable."
              action={<PillButton onClick={() => catalog.refetch()}>Retry</PillButton>}
            />
          )}
          {!search && visible[0] && (
            <CatalogCard
              candidate={visible[0]}
              showDetails={() => setSelected(visible[0]!.manifest.metadata.id)}
              featured
            />
          )}
          {catalog.data && visible.length === 0 && (
            <EmptyState
              title={search ? 'No matching applications' : 'Local catalog is empty'}
              message={
                search
                  ? 'Try another name.'
                  : 'Your installed applications are still available from Home.'
              }
            />
          )}
          {visible.length > 0 && (
            <section>
              <h3 className="mb-4 text-title-medium font-semibold">
                {search ? 'Search results' : 'For your personal cloud'}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {visible.map((candidate) => (
                  <CatalogCard
                    key={candidate.manifest.metadata.id}
                    candidate={candidate}
                    showDetails={() => setSelected(candidate.manifest.metadata.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppWindow>
  )
}
