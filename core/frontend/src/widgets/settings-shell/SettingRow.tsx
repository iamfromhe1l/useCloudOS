import type { PropsWithChildren } from 'react'

import styles from './Settings.module.css'
export function SettingRow({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <div className={styles.row}>
      <div>
        <h4>{title}</h4>
        {description && <p>{description}</p>}
      </div>
      <div className={styles.control}>{children}</div>
    </div>
  )
}
