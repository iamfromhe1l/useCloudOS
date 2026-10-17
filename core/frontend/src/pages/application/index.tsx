import { useLocation, useParams } from 'react-router-dom'

import { AppWindow, useApplication, useApplicationRegistry } from '@/entities/application'
import { ErrorState, LoadingState } from '@/shared/ui'
import { AppHost, AppHostErrorBoundary } from '@/widgets/app-host'
export function ApplicationPage() {
  const params = useParams()
  const { search } = useLocation()
  const registry = useApplicationRegistry()
  const app = useApplication(params.appId ?? '')
  const route = (params['*'] ? '/' + params['*'] : '/') + search
  if (registry.isPending) return <LoadingState />
  if (!app?.installed)
    return (
      <AppWindow appId="home" title="Application unavailable">
        <ErrorState message="Application is not installed. Open Store to install it." />
      </AppWindow>
    )
  return (
    <AppWindow appId={app.id}>
      <AppHostErrorBoundary key={app.id + app.installed.manifest.metadata.version}>
        <AppHost application={app.installed} route={route} />
      </AppHostErrorBoundary>
    </AppWindow>
  )
}
