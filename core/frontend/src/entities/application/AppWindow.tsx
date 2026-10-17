import type { PropsWithChildren, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { cn, Icon, IconButton, OverflowText, Tooltip } from '@/shared/ui'

import { AppIcon } from './AppIcon'
import styles from './AppWindow.module.css'
import { useApplication } from './registry'
interface Props extends PropsWithChildren {
  appId: string
  title?: string
  subtitle?: string
  leading?: ReactNode
  actions?: ReactNode
  className?: string
}
export function WindowTitleBar({
  appId,
  title,
  subtitle,
  leading,
  actions,
}: Omit<Props, 'children' | 'className'>) {
  const app = useApplication(appId)
  const navigate = useNavigate()
  const windowTitle = title ?? app?.name ?? appId
  return (
    <header className={styles.titlebar}>
      {leading}
      {app && <AppIcon application={app} />}
      <div className={styles.identity}>
        <h1>
          <OverflowText text={windowTitle} />
        </h1>
        {subtitle && (
          <p>
            <OverflowText text={subtitle} />
          </p>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
      <Tooltip label="Close application · Home">
        <IconButton
          label={'Close ' + windowTitle}
          onClick={() => navigate('/')}
          icon={<Icon name="close" className="size-5" />}
        />
      </Tooltip>
    </header>
  )
}
export function AppWindow({
  appId,
  title,
  subtitle,
  leading,
  actions,
  className,
  children,
}: Props) {
  return (
    <section className={cn(styles.window, className)} data-app-window>
      <WindowTitleBar
        appId={appId}
        title={title}
        subtitle={subtitle}
        leading={leading}
        actions={actions}
      />
      <div className={styles.content}>{children}</div>
    </section>
  )
}
