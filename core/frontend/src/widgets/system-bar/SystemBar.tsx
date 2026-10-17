import { lazy, type ReactNode, Suspense, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useApplicationForPath, useApplicationRegistry } from '@/entities/application'
import { useSystemResources } from '@/entities/system'
import { formatBytes, formatPercentage } from '@/shared/lib'
import { Icon, Tooltip } from '@/shared/ui'

import styles from './SystemBar.module.css'
import { SystemBarItem, SystemBarSection, SystemMetric } from './SystemBarItem'
import { SystemClock } from './SystemClock'
const ResourcePopover = lazy(() =>
  import('./ResourcePopover').then((m) => ({ default: m.ResourcePopover })),
)
export function SystemBar({ controlCenter }: { controlCenter: ReactNode }) {
  const { pathname } = useLocation()
  const app = useApplicationForPath(pathname)
  const resources = useSystemResources()
  const registry = useApplicationRegistry()
  const [resourcesRequested, setResourcesRequested] = useState(false)
  const dockerStatus = 'Installed applications: ' + (registry.data?.applications.length ?? 0)
  return (
    <header className={styles.bar} aria-label="System bar">
      <SystemBarSection>
        <Tooltip label="Home · useCloudOS">
          <Link to="/" className={styles.launcher} aria-label="Open Home">
            <Icon name="gridView" className="size-5" />
          </Link>
        </Tooltip>
        <SystemBarItem>
          <span className={styles.app}>{app.name}</span>
          <span className={styles.identity}>useCloudOS</span>
        </SystemBarItem>
      </SystemBarSection>
      <SystemBarSection>
        <ResourceModule requested={resourcesRequested} request={() => setResourcesRequested(true)}>
          <SystemMetric
            icon="memory"
            label="CPU"
            value={resources.data ? formatPercentage(resources.data.cpu.usage_percent) : '—'}
          />
          <SystemMetric
            icon="storage"
            label="RAM"
            value={resources.data ? formatBytes(resources.data.memory.used_bytes) : '—'}
          />
        </ResourceModule>
        <div className={styles.docker}>
          <Tooltip label={dockerStatus}>
            <span className={styles.status} role="img" aria-label={dockerStatus}>
              <Icon name="apps" className="size-4" />
              <span className={styles.dot} data-online={!!registry.data} />
            </span>
          </Tooltip>
        </div>
        <SystemClock />
        {controlCenter}
      </SystemBarSection>
    </header>
  )
}
function ResourceModule({
  requested,
  request,
  children,
}: {
  requested: boolean
  request: () => void
  children: ReactNode
}) {
  const trigger = (
    <button className={styles.metrics} aria-label="System resources" onClick={request}>
      {children}
    </button>
  )
  return requested ? (
    <Suspense fallback={trigger}>
      <ResourcePopover>{children}</ResourcePopover>
    </Suspense>
  ) : (
    trigger
  )
}
