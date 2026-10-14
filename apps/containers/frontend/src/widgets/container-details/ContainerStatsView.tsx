import { useContainerStats } from '@/entities/container'
import { formatBytes, formatPercentage } from '@/shared/lib'
import { ErrorState, LoadingState, MetricWidget } from '@/shared/ui'

import styles from './ContainerDetails.module.css'
export function ContainerStatsView({ id }: { id: string }) {
  const query = useContainerStats(id)
  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorState message="Failed to load container stats." />
  const stats = query.data
  return (
    <section className={styles.metrics} aria-label="Container stats">
      <MetricWidget
        label="CPU"
        value={formatPercentage(stats.cpu_percent)}
        progress={stats.cpu_percent}
      />
      <MetricWidget
        label="Memory"
        value={formatBytes(stats.memory.used_bytes)}
        detail={'of ' + formatBytes(stats.memory.limit_bytes)}
        progress={stats.memory.usage_percent}
        tone="secondary"
      />
      <MetricWidget
        label="Network"
        value={formatBytes(stats.network.rx_bytes) + ' ↓'}
        detail={formatBytes(stats.network.tx_bytes) + ' ↑'}
        tone="tertiary"
      />
      <MetricWidget
        label="Block I/O"
        value={formatBytes(stats.block_io.read_bytes) + ' read'}
        detail={formatBytes(stats.block_io.write_bytes) + ' written'}
      />
    </section>
  )
}
