import { useFilesystems } from '@/entities/storage'
import { formatBytes } from '@/shared/lib'
import { ErrorState, LoadingState, MetricWidget } from '@/shared/ui'

import { DesktopWidget, WidgetContent, WidgetFooter, WidgetHeader } from './DesktopWidget'
export function StorageWidget() {
  const query = useFilesystems()
  const dataDisk = query.data?.filesystems.find((item) => item.mount_point === '/data')
  const disk =
    query.data?.filesystems.find((item) => item.mount_point === '/') ?? query.data?.filesystems[0]
  return (
    <DesktopWidget>
      <WidgetHeader icon="hardDrive" title="Storage" />
      <WidgetContent>
        {query.isPending && <LoadingState />}
        {query.isError && <ErrorState message="Storage unavailable." />}
        {disk && (
          <MetricWidget
            label={disk.mount_point + ' · available'}
            value={formatBytes(disk.available_bytes)}
            detail={'of ' + formatBytes(disk.total_bytes)}
            progress={disk.usage_percent}
            tone="tertiary"
          />
        )}
      </WidgetContent>
      <WidgetFooter>
        {dataDisk && (
          <p className="font-mono">/data · {formatBytes(dataDisk.available_bytes)} available</p>
        )}
        {query.data ? query.data.filesystems.length + ' mounted filesystems' : 'Linux storage'}
      </WidgetFooter>
    </DesktopWidget>
  )
}
