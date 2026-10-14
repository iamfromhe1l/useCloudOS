import { useSystemInfo } from '@/entities/system'
import { ErrorState, InfoRow, LoadingState } from '@/shared/ui'

import { DesktopWidget, WidgetContent, WidgetHeader } from './DesktopWidget'
export function SystemWidget() {
  const query = useSystemInfo()
  return (
    <DesktopWidget>
      <WidgetHeader icon="dns" title="System" />
      <WidgetContent>
        {query.isPending && <LoadingState />}
        {query.isError && <ErrorState message="Failed to load system information." />}
        {query.data && (
          <dl>
            <InfoRow label="OS" value={query.data.os.name + ' ' + query.data.os.version} />
            <InfoRow label="Architecture" value={query.data.kernel.architecture} mono />
            <InfoRow label="Kernel" value={query.data.kernel.release} mono />
          </dl>
        )}
      </WidgetContent>
    </DesktopWidget>
  )
}
