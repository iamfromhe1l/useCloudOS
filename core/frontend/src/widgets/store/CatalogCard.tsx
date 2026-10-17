import type { PackageMetadata } from '@usecloud/manifest'
import { Link } from 'react-router-dom'

import { AppIcon, manifestIdentity, TrustBadge, useApplication } from '@/entities/application'
import { InstallApp } from '@/features/install-app'
import { Icon } from '@/shared/ui'

export function CatalogCard({
  candidate,
  showDetails,
  featured = false,
  detail = false,
}: {
  candidate: PackageMetadata
  showDetails?: () => void
  featured?: boolean
  detail?: boolean
}) {
  const m = candidate.manifest
  const installed = useApplication(m.metadata.id)
  const Identity = showDetails ? 'button' : 'div'
  return (
    <section
      data-catalog-app={m.metadata.id}
      className={
        featured
          ? 'relative grid min-w-0 gap-4 rounded-shape-extra-large bg-tertiary-container p-5 text-on-tertiary-container sm:grid-cols-[1fr_auto] sm:p-6'
          : 'min-w-0 rounded-shape-large bg-surface-container p-5'
      }
    >
      <div className="min-w-0">
        {featured && !detail && (
          <p className="mb-5 text-label-medium font-semibold">MADE FOR YOUR CLOUD</p>
        )}
        <Identity
          onClick={showDetails}
          className="group flex w-full min-w-0 items-center gap-4 rounded-shape-medium text-left"
        >
          <AppIcon
            application={manifestIdentity(m)}
            className={
              featured && !detail
                ? '!size-20 !rounded-shape-large [&>span]:!size-10'
                : '!size-14 [&>span]:!size-7'
            }
          />
          <span className="min-w-0">
            <h2
              className={
                featured && !detail
                  ? 'text-headline-large font-semibold'
                  : 'text-title-large font-semibold'
              }
            >
              {m.metadata.name}
            </h2>
            <span className="mt-1 block text-body-small opacity-85">By {m.metadata.author}</span>
          </span>
          {showDetails && (
            <Icon
              name="chevronRight"
              className="ml-auto size-5 shrink-0 opacity-60 group-hover:opacity-100"
            />
          )}
        </Identity>
        <p className="mt-5 max-w-lg text-body-medium [overflow-wrap:anywhere]">
          {m.metadata.description}
        </p>
        <div className="mt-4">
          <TrustBadge trust={candidate.trust} publisher={candidate.signature?.publisherName} />
        </div>
      </div>
      <div className={featured ? 'mt-5 flex items-end gap-2 sm:mt-0' : 'mt-5 flex items-end gap-2'}>
        {installed?.installed?.manifest.metadata.version === m.metadata.version ? (
          <Link
            to={'/apps/' + m.metadata.id}
            className="inline-flex min-h-11 items-center justify-center rounded-shape-medium bg-primary px-5 text-label-large font-semibold text-on-primary"
          >
            Open
          </Link>
        ) : (
          <InstallApp candidate={candidate} />
        )}
      </div>
    </section>
  )
}
