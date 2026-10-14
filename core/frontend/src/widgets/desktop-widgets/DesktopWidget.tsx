import type { PropsWithChildren, ReactNode } from 'react'

import { cn, Icon, type IconName } from '@/shared/ui'

import styles from './DesktopWidget.module.css'
export function DesktopWidget({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn(styles.widget, className)}>{children}</section>
}
export function WidgetHeader({
  icon,
  title,
  status,
}: {
  icon: IconName
  title: string
  status?: ReactNode
}) {
  return (
    <header className={styles.header}>
      <Icon name={icon} className="size-5" />
      <h2>{title}</h2>
      {status}
    </header>
  )
}
export function WidgetContent({ children }: PropsWithChildren) {
  return <div className={styles.content}>{children}</div>
}
export function WidgetFooter({ children }: PropsWithChildren) {
  return <footer className={styles.footer}>{children}</footer>
}
