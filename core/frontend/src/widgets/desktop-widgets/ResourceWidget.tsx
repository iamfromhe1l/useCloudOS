import { useSystemResources } from '@/entities/system'
import { formatBytes, formatPercentage } from '@/shared/lib'
import { ErrorState, LoadingState, MetricWidget, RetryAction } from '@/shared/ui'

import { DesktopWidget, WidgetContent, WidgetHeader } from './DesktopWidget'
import styles from './DesktopWidget.module.css'
export function ResourceWidget() {
  const query = useSystemResources()
  return (
    <DesktopWidget>
      <WidgetHeader icon="memory" title="Resources" />
      <WidgetContent>
        {query.isPending && <LoadingState />}
        {query.isError && (
          <ErrorState
            message="Failed to load system resources."
            action={<RetryAction onRetry={() => void query.refetch()} />}
          />
        )}
        {query.data && (
          <div className={styles.metrics}>
            <MetricWidget
              label="CPU"
              value={formatPercentage(query.data.cpu.usage_percent)}
              detail={query.data.cpu.logical_cores + ' logical cores'}
              progress={query.data.cpu.usage_percent}
            />
            <MetricWidget
              label="Memory"
              tone="secondary"
              value={formatBytes(query.data.memory.used_bytes)}
              detail={formatBytes(query.data.memory.available_bytes) + ' available'}
              progress={query.data.memory.usage_percent}
            />
          </div>
        )}
      </WidgetContent>
    </DesktopWidget>
  )
}
