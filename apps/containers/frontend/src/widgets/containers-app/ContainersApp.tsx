import { Link } from 'react-router-dom'

import { ContainerItem, useContainers } from '@/entities/container'
import { ContainerFilters, useContainerFilter } from '@/features/container-filter'
import { ContainerActions } from '@/features/container-lifecycle'
import { ApiError } from '@/shared/api'
import { EmptyState, ErrorState, Icon, LoadingState, PillButton, RetryAction } from '@/shared/ui'
import { AppContent } from '@/shared/ui/AppContent'

import styles from './ContainersApp.module.css'
const emptyContainers: never[] = []
export function ContainersApp() {
  const query = useContainers()
  const { filter, setFilter, visible } = useContainerFilter(
    query.data?.containers ?? emptyContainers,
  )
  const unavailable = query.error instanceof ApiError && query.error.code === 'DOCKER_UNAVAILABLE'
  const errorTitle = unavailable ? 'Docker is unavailable' : 'Unable to load containers'
  const errorMessage = unavailable ? 'Docker is unavailable.' : 'Failed to load containers.'
  const emptyTitle = filter === 'all' ? 'No containers found' : 'No ' + filter + ' containers'
  const refresh = (
    <PillButton
      iconOnly
      tone="quiet"
      aria-label="Refresh containers"
      onClick={() => void query.refetch()}
      icon={<Icon name="refresh" className="size-5" />}
    />
  )
  return (
    <AppContent
      subtitle={
        query.data ? query.data.containers.length + ' services on Docker Engine' : 'Docker Engine'
      }
      actions={refresh}
    >
      <div className={styles.toolbar}>
        <ContainerFilters value={filter} onChange={setFilter} />
      </div>
      <div className={styles.content}>
        {query.isPending && <LoadingState />}
        {query.isError && (
          <ErrorState
            title={errorTitle}
            message={errorMessage}
            action={<RetryAction onRetry={() => void query.refetch()} />}
          />
        )}
        {query.data && !visible.length && (
          <EmptyState title={emptyTitle} message="Containers created in the VM will appear here." />
        )}
        <div className={styles.list}>
          {visible.map((container) => (
            <ContainerListItem key={container.id} container={container} />
          ))}
        </div>
      </div>
    </AppContent>
  )
}
function ContainerListItem({
  container,
}: {
  container: import('@/entities/container').ContainerSummary
}) {
  const name = container.name || container.id.slice(0, 12)
  const actions = (
    <div className={styles.actions}>
      <ContainerActions id={container.id} name={name} state={container.state} />
      <Link
        to={'/containers/' + encodeURIComponent(container.id)}
        aria-label={'View details for ' + name}
        className={styles.details}
      >
        <Icon name="arrowBack" className="size-5 rotate-180" />
      </Link>
    </div>
  )
  return <ContainerItem container={container} actions={actions} />
}
