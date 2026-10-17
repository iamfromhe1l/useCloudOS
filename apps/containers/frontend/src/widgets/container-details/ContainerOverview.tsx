import type { ContainerDetails } from '@/entities/container'
import { formatTimestamp } from '@/shared/lib'
import { EmptyState, Icon, InfoRow, TonalSurface } from '@/shared/ui'

import styles from './ContainerDetails.module.css'
export function ContainerOverview({ container }: { container: ContainerDetails }) {
  return (
    <section aria-label="Container overview">
      <div className={styles.identity}>
        <Icon name="deployedCode" className="size-8" />
        <div>
          <h2>{container.name}</h2>
          <p>{container.id}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TonalSurface>
          <h3 className="mb-3 text-title-medium font-semibold">Identity</h3>
          <dl>
            <InfoRow label="Image" value={container.image} mono />
            <InfoRow label="State" value={container.state} />
          </dl>
        </TonalSurface>
        <TonalSurface>
          <h3 className="mb-3 text-title-medium font-semibold">Lifecycle</h3>
          <dl>
            <InfoRow label="Created" value={formatTimestamp(container.created_at)} />
            <InfoRow label="Started" value={formatTimestamp(container.started_at)} />
            <InfoRow label="Restart count" value={container.restart_count} />
          </dl>
        </TonalSurface>
      </div>
    </section>
  )
}
export function ContainerPorts({ container }: { container: ContainerDetails }) {
  if (!container.ports.length) return <EmptyState title="No published ports" />
  return (
    <TonalSurface>
      <ul className={styles.ports}>
        {container.ports.map((port, index) => (
          <li key={index}>
            <span>Host</span>
            <code>{port.host_port || '—'}</code>
            <Icon name="arrowBack" className="size-4 rotate-180" />
            <span>Container</span>
            <code>
              {port.container_port}/{port.protocol}
            </code>
          </li>
        ))}
      </ul>
    </TonalSurface>
  )
}
