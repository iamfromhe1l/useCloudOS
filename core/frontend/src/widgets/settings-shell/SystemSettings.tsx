import { useSystemInfo } from '@/entities/system'
import { useTheme } from '@/shared/config/theme'
import { EmptyState, ErrorState, InfoRow, LoadingState, SettingsSection } from '@/shared/ui'

import styles from './Settings.module.css'
export function ComingLater({ title }: { title: string }) {
  return <EmptyState title={title} message="Coming later. This capability is not enabled yet." />
}
export function SystemSettings() {
  const query = useSystemInfo()
  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorState message="Failed to load system information." />
  const system = query.data
  return (
    <div>
      <h2 className={styles.heading}>System</h2>
      <SettingsSection title="Linux host">
        <dl>
          <InfoRow label="Hostname" value={system.hostname} mono />
          <InfoRow label="Operating system" value={system.os.name + ' ' + system.os.version} />
          <InfoRow label="Architecture" value={system.kernel.architecture} mono />
          <InfoRow label="Kernel" value={system.kernel.release} mono />
        </dl>
      </SettingsSection>
    </div>
  )
}
export function AccessibilitySettings() {
  const { reduceTransparency } = useTheme()
  return (
    <div>
      <h2 className={styles.heading}>Accessibility</h2>
      <SettingsSection title="Interaction">
        <dl>
          <InfoRow label="Reduced motion" value="Follows operating system" />
          <InfoRow label="Forced colors" value="Supported" />
          <InfoRow label="Touch targets" value="44 px minimum" />
          <InfoRow label="Transparency" value={reduceTransparency ? 'Reduced' : 'Standard'} />
        </dl>
      </SettingsSection>
    </div>
  )
}
export function AboutSettings() {
  return (
    <div>
      <h2 className={styles.heading}>About useCloudOS</h2>
      <SettingsSection title="Personal cloud operating environment">
        <dl>
          <InfoRow label="Theme engine" value="Material Color Utilities · Tonal Spot" />
          <InfoRow label="Runtime" value="Native Linux cloud-core" />
        </dl>
      </SettingsSection>
    </div>
  )
}
