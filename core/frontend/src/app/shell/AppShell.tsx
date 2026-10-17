import { type PropsWithChildren, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import { useApplicationForPath } from '@/entities/application'
import { Dock } from '@/widgets/dock'
import { SystemBar } from '@/widgets/system-bar'

import styles from './AppShell.module.css'
import { ControlCenterLoader } from './ControlCenterLoader'
export function AppShell({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const application = useApplicationForPath(pathname)
  const main = useRef<HTMLElement>(null)
  const initialPath = useRef(pathname)
  useEffect(() => {
    document.title = application.name + ' · useCloudOS'
    if (initialPath.current !== pathname) {
      main.current?.focus({ preventScroll: true })
      initialPath.current = pathname
    }
  }, [pathname, application.name])
  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skip}>
        Skip to main content
      </a>
      <SystemBar controlCenter={<ControlCenterLoader />} />
      <main ref={main} id="main-content" tabIndex={-1} className={styles.workspace}>
        <div className={styles.content} data-workspace>
          {children}
        </div>
      </main>
      <Dock />
    </div>
  )
}
