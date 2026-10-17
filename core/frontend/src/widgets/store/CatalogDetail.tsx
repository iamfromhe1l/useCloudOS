import { type PackageMetadata, permissionMetadata } from '@usecloud/manifest'

import { TrustBadge } from '@/entities/application'
import { formatBytes } from '@/shared/lib'
import { Icon, InfoRow, PillButton, SettingsSection } from '@/shared/ui'

import { CatalogCard } from './CatalogCard'
export function CatalogDetail({
  candidate,
  back,
}: {
  candidate: PackageMetadata
  back: () => void
}) {
  const m = candidate.manifest
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <PillButton tone="quiet" onClick={back} icon={<Icon name="arrowBack" className="size-5" />}>
        All applications
      </PillButton>
      <CatalogCard candidate={candidate} featured detail />
      <SettingsSection title="About this application">
        <p className="text-body-medium">{m.metadata.description}</p>
        <p className="mt-3 text-body-small text-on-surface-variant">
          Runs on your cloud. Application data is retained independently of the installed package.
        </p>
      </SettingsSection>
      <SettingsSection
        title="Requested access"
        description="You review and grant access before installation."
      >
        <ul className="space-y-4">
          {m.permissions.map((id) => (
            <li key={id}>
              <p className="text-label-large">{permissionMetadata[id].title}</p>
              <p className="mt-1 text-body-small text-on-surface-variant">
                {permissionMetadata[id].description}
              </p>
            </li>
          ))}
        </ul>
      </SettingsSection>
      <SettingsSection title="Information">
        <dl>
          <InfoRow label="Version" value={m.metadata.version} />
          <InfoRow label="Runtime" value={m.runtime.type} />
          {candidate.sizeBytes && (
            <InfoRow label="Package size" value={formatBytes(candidate.sizeBytes)} />
          )}
          <InfoRow
            label="Publisher"
            value={
              <TrustBadge
                trust={candidate.trust}
                publisher={candidate.signature?.publisherName ?? m.metadata.author}
              />
            }
          />
        </dl>
      </SettingsSection>
    </div>
  )
}
