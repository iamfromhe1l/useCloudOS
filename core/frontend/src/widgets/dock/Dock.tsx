import * as Toolbar from '@radix-ui/react-toolbar'

import { useApplications } from '@/entities/application'

import styles from './Dock.module.css'
import { DockItem } from './DockItem'
export function Dock() {
  const applications = useApplications()
  return (
    <nav aria-label="Primary navigation" className={styles.shell} data-dock>
      <Toolbar.Root className={styles.surface} aria-label="Application launcher">
        {applications
          .filter((app) => app.dock)
          .map((app) => (
            <DockItem key={app.id} application={app} />
          ))}
      </Toolbar.Root>
    </nav>
  )
}
