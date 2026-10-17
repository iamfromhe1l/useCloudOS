import { useApplicationRegistry } from '@/entities/application'
import { useNotifications } from '@/entities/notification'
import { useFilesystems } from '@/entities/storage'
import { useSystemInfo } from '@/entities/system'
import { useTheme } from '@/shared/config/theme'
import { formatBytes, formatPercentage } from '@/shared/lib'
import { Icon, InfoRow, QuickSettingTile, StatusChip } from '@/shared/ui'

import styles from './ControlCenter.module.css'
export function ControlCenterContent() {
  const system = useSystemInfo()
  const notifications = useNotifications()
  const registry = useApplicationRegistry()
  const storage = useFilesystems()
  const { resolvedMode, setMode } = useTheme()
  const disk = storage.data?.filesystems.find((item) => item.mount_point === '/')
  const dockerDescription = (registry.data?.applications.length ?? 0) + ' installed'
  const storageDescription = disk
    ? formatBytes(disk.available_bytes) +
      ' free · ' +
      formatPercentage(disk.usage_percent) +
      ' used'
    : 'Unavailable'
  const status = system.isPending ? 'Connecting' : system.isError ? 'Offline' : 'Online'
  return (
    <>
      <div className={styles.identity}>
        <span className={styles.orb}>
          <Icon name="cloud" className="size-6" />
        </span>
        <div className={styles.device}>
          <p title={system.data?.hostname}>{system.data?.hostname ?? 'useCloudOS'}</p>
          <small>
            {system.data
              ? system.data.os.name + ' ' + system.data.os.version
              : 'Personal cloud system'}
          </small>
        </div>
        <StatusChip tone={system.isError ? 'error' : system.isPending ? 'neutral' : 'success'}>
          {status}
        </StatusChip>
      </div>
      <section>
        <h2 className={styles.sectionTitle}>Quick controls</h2>
        <div className={styles.quick}>
          <QuickSettingTile
            icon="deployedCode"
            label="Applications"
            detail={dockerDescription}
            active={!!registry.data}
            disabled
          />
          <QuickSettingTile
            icon="palette"
            label="Theme"
            detail={resolvedMode}
            active
            onClick={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')}
          />
          <QuickSettingTile icon="networkWifi" label="Network" detail="Coming later" disabled />
          <QuickSettingTile icon="backup" label="Backup" detail="Coming later" disabled />
        </div>
      </section>
      <section>
        <h2 className={styles.sectionTitle}>Status</h2>
        <dl className={styles.status}>
          <InfoRow label="Applications" value={dockerDescription} />
          <InfoRow label="System storage" value={storageDescription} />
        </dl>
      </section>
      <section className={styles.notifications}>
        <div>
          <h2>Notifications</h2>
          {notifications.isPending && <p>Loading notifications…</p>}
          {notifications.isError && <p>Notifications unavailable.</p>}
          {notifications.data?.notifications.length === 0 && <p>No recent system events</p>}
          <ul className="space-y-2 [overflow-wrap:anywhere]">
            {notifications.data?.notifications.map((notification) => (
              <li key={notification.id}>{notification.message}</li>
            ))}
          </ul>
        </div>
        <Icon name="notifications" className="size-5" />
      </section>
    </>
  )
}
