import { useSystemInfo } from '@/entities/system'
import { formatDuration } from '@/shared/lib'
import { Icon, OverflowText } from '@/shared/ui'

import { DesktopWidget } from './DesktopWidget'
import styles from './DesktopWidget.module.css'
export function ServerWidget() {
  const query = useSystemInfo()
  const hostname = query.data?.hostname ?? 'useCloudOS'
  const description = query.data
    ? 'Online · ' + formatDuration(query.data.uptime_seconds) + ' uptime'
    : 'Connecting to your cloud…'
  return (
    <DesktopWidget>
      <div className={styles.server}>
        <span className={styles.serverIcon}>
          <Icon name="cloud" className="size-7" />
        </span>
        <div className={styles.serverText}>
          <p>
            <OverflowText text={hostname} />
          </p>
          <small>{description}</small>
        </div>
      </div>
    </DesktopWidget>
  )
}
