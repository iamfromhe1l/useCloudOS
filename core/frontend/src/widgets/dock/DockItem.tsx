import * as Toolbar from '@radix-ui/react-toolbar'
import { NavLink, useLocation } from 'react-router-dom'

import { AppIcon, type Application } from '@/entities/application'
import { cn, Tooltip } from '@/shared/ui'

import styles from './Dock.module.css'
export function DockItem({
  application,
  openActions,
}: {
  application: Application
  openActions: (app: Application) => void
}) {
  const { pathname } = useLocation()
  const active =
    application.route === '/'
      ? pathname === '/'
      : Boolean(application.route && pathname.startsWith(application.route))
  const unavailable = application.availability === 'soon'
  const label = application.name + (unavailable ? ' · coming later' : '')
  const content = (
    <>
      <AppIcon application={application} />
      <span className={styles.label}>{application.name}</span>
      <span
        className={styles.indicator}
        data-running={application.installed?.status === 'running'}
        aria-hidden="true"
      />
    </>
  )
  const className = cn(styles.item, active && styles.active, unavailable && styles.unavailable)
  return (
    <Tooltip label={label}>
      {application.route ? (
        <Toolbar.Link asChild>
          <NavLink
            to={application.route}
            end={application.id === 'home'}
            aria-label={application.name}
            className={className}
            onContextMenu={(event) => {
              event.preventDefault()
              openActions(application)
            }}
          >
            {content}
          </NavLink>
        </Toolbar.Link>
      ) : (
        <Toolbar.Button aria-label={label} aria-disabled="true" className={className}>
          {content}
        </Toolbar.Button>
      )}
    </Tooltip>
  )
}
