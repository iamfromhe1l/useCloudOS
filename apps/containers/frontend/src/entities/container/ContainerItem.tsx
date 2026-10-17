import type { ReactNode } from 'react'

import { Icon, OverflowText, StatusChip } from '@/shared/ui'

import styles from './ContainerItem.module.css'
import { containerStatusTone } from './state'
import type { ContainerSummary } from './types'
export function ContainerItem({
  container,
  actions,
}: {
  container: ContainerSummary
  actions?: ReactNode
}) {
  const name = container.name || container.id.slice(0, 12)
  return (
    <article className={styles.item}>
      <span className={styles.icon}>
        <Icon name="deployedCode" className="size-6" />
      </span>
      <div className={styles.identity}>
        <div className={styles.title}>
          <h2>
            <OverflowText text={name} />
          </h2>
          <StatusChip tone={containerStatusTone(container.state)}>{container.state}</StatusChip>
        </div>
        <p className={styles.image}>
          <OverflowText text={container.image} />
        </p>
        <p className={styles.meta}>{container.status}</p>
      </div>
      <div className={styles.actions}>{actions}</div>
    </article>
  )
}
