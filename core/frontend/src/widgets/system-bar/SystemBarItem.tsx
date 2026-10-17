import type { PropsWithChildren } from 'react'

import { Icon, type IconName } from '@/shared/ui'

import styles from './SystemBar.module.css'
export function SystemBarSection({ children }: PropsWithChildren) {
  return <div className={styles.section}>{children}</div>
}
export function SystemBarItem({ children }: PropsWithChildren) {
  return <span className={styles.item}>{children}</span>
}
export function SystemMetric({
  icon,
  label,
  value,
}: {
  icon: IconName
  label: string
  value: string
}) {
  return (
    <SystemBarItem>
      <Icon name={icon} className="size-4" />
      <span className={styles.metricLabel}>{label}</span>
      <span>{value}</span>
    </SystemBarItem>
  )
}
