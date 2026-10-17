import { AppIcon, toApplication, useApplicationRegistry } from '@/entities/application'
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
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-metric-medium font-medium">{running}</span>
              <span className="text-body-small text-on-surface-variant">
                ready to open · {apps.length} installed
              </span>
            </div>
            <div className="space-y-2">
              {apps.slice(0, 3).map((app) => (
                <div key={app.manifest.metadata.id} className="flex min-w-0 items-center gap-2">
                  <AppIcon
                    application={toApplication(app)}
                    className="!size-8 !rounded-shape-small [&>span]:!size-4"
                  />
                  <span className="min-w-0 flex-1 truncate text-label-large">
                    {app.manifest.metadata.name}
                  </span>
                  <StatusChip tone={app.status === 'running' ? 'success' : 'neutral'}>
                    {app.status}
                  </StatusChip>
                </div>
              ))}
            </div>
          </div>
        )}
      </WidgetContent>
      <WidgetFooter>App status refreshes automatically.</WidgetFooter>
    </DesktopWidget>
  )
}
