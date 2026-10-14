import { Link } from 'react-router-dom'

import { useApplicationRegistry } from '@/entities/application'
import { ErrorState, LoadingState, StatusChip } from '@/shared/ui'

import { DesktopWidget, WidgetContent, WidgetFooter, WidgetHeader } from './DesktopWidget'
export function ApplicationsWidget() {
  const query = useApplicationRegistry()
  const apps = query.data?.applications ?? []
  const running = apps.filter((app) => app.status === 'running' || app.status === 'ready').length
  return (
    <DesktopWidget>
      <WidgetHeader icon="apps" title="Applications" />
      <WidgetContent>
        {query.isPending && <LoadingState />}
        {query.isError && <ErrorState message="Application registry unavailable." />}
        {query.data && (
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip tone="success">{running} available</StatusChip>
            <p>{apps.length} installed applications</p>
          </div>
        )}
      </WidgetContent>
      <WidgetFooter>
        <Link to="/store" className="text-primary">
          Open Store
        </Link>
      </WidgetFooter>
    </DesktopWidget>
  )
}
