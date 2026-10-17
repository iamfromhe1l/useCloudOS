import * as Toolbar from '@radix-ui/react-toolbar'
import { lazy, Suspense, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { type Application, useApplicationForPath, useApplications } from '@/entities/application'
import { Icon, PillButton, Tooltip } from '@/shared/ui'

import styles from './Dock.module.css'
import { DockItem } from './DockItem'
const DockApplicationMenu = lazy(() =>
  import('./DockApplicationMenu').then((m) => ({ default: m.DockApplicationMenu })),
)
export function Dock() {
  const applications = useApplications()
  const { pathname } = useLocation()
  const active = useApplicationForPath(pathname)
  const [selected, setSelected] = useState<Application | null>(null)
  const [requested, setRequested] = useState(false)
  function openActions(app: Application) {
    setSelected(app)
    setRequested(true)
  }
  const button = (
    <Tooltip label="Application actions">
      <Toolbar.Button asChild>
        <PillButton
          iconOnly
          tone="quiet"
          aria-label="Application actions"
          aria-haspopup="menu"
          onClick={() => openActions(active)}
        >
          <Icon name="moreHoriz" className="size-5" />
        </PillButton>
      </Toolbar.Button>
    </Tooltip>
  )
  return (
    <nav aria-label="Primary navigation" className={styles.shell} data-dock>
      <Toolbar.Root className={styles.surface} aria-label="Application launcher">
        {applications
          .filter((app) => app.dock)
          .map((app) => (
            <DockItem key={app.id} application={app} openActions={openActions} />
          ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-outline-variant" aria-hidden="true" />
        {requested ? (
          <Suspense fallback={button}>
            <DockApplicationMenu
              application={selected ?? active}
              open={!!selected}
              onOpenChange={(open) => setSelected(open ? active : null)}
            />
          </Suspense>
        ) : (
          button
        )}
      </Toolbar.Root>
    </nav>
  )
}
