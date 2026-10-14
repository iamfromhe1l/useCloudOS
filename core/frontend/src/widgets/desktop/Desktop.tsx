import { Link } from 'react-router-dom'

import { AppIcon, type Application, useApplications } from '@/entities/application'
import { Tooltip } from '@/shared/ui'

import styles from './Desktop.module.css'
export function DesktopGrid({
  server,
  resources,
  storage,
  docker,
  system,
}: Record<'server' | 'resources' | 'storage' | 'docker' | 'system', React.ReactNode>) {
  return (
    <section className={styles.grid} aria-label="System widgets">
      <div className={styles.server}>{server}</div>
      <div className={styles.resources}>{resources}</div>
      <div className={styles.storage}>{storage}</div>
      <div className={styles.docker}>{docker}</div>
      <div className={styles.system}>{system}</div>
    </section>
  )
}
export function DesktopApplications() {
  const applications = useApplications()
  return (
    <nav className={styles.launchers} aria-label="Desktop applications">
      {applications
        .filter((app) => app.desktop)
        .map((app) => (
          <DesktopAppIcon key={app.id} application={app} />
        ))}
    </nav>
  )
}
export function DesktopAppIcon({ application }: { application: Application }) {
  const content = (
    <>
      <AppIcon application={application} />
      <span>{application.name}</span>
      {application.availability === 'soon' && <small>Soon</small>}
    </>
  )
  const label = application.name + (application.availability === 'soon' ? ' · coming later' : '')
  return (
    <Tooltip label={label}>
      {application.route ? (
        <Link to={application.route} className={styles.launcher}>
          {content}
        </Link>
      ) : (
        <button type="button" aria-disabled="true" className={styles.launcher}>
          {content}
        </button>
      )}
    </Tooltip>
  )
}
export function Desktop({ children }: React.PropsWithChildren) {
  return <div className={styles.desktop}>{children}</div>
}
