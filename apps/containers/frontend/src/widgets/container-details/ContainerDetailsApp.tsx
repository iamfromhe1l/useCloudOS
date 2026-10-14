import * as Tabs from '@radix-ui/react-tabs'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { containerStatusTone, useContainer } from '@/entities/container'
import { ContainerActions } from '@/features/container-lifecycle'
import { ErrorState, Icon, LoadingState, RetryAction, StatusChip } from '@/shared/ui'
import { AppContent } from '@/shared/ui/AppContent'

import styles from './ContainerDetails.module.css'
import { ContainerLogsView } from './ContainerLogsView'
import { ContainerOverview, ContainerPorts } from './ContainerOverview'
import { ContainerStatsView } from './ContainerStatsView'
const tabs = ['Overview', 'Stats', 'Ports', 'Logs'] as const
export function ContainerDetailsApp({ id }: { id: string }) {
  const query = useContainer(id)
  const [tab, setTab] = useState('overview')
  const container = query.data
  if (!container)
    return (
      <AppContent title="Container">
        {query.isPending ? (
          <LoadingState message="Loading container..." />
        ) : (
          <ErrorState
            message="Failed to load container details."
            action={<RetryAction onRetry={() => void query.refetch()} />}
          />
        )}
      </AppContent>
    )
  const name = container.name || container.id.slice(0, 12)
  const back = (
    <Link to="/containers" aria-label="Back to containers" className={styles.back}>
      <Icon name="arrowBack" className="size-5" />
    </Link>
  )
  return (
    <AppContent
      title={name}
      subtitle={container.image}
      leading={back}
      actions={
        <StatusChip tone={containerStatusTone(container.state)}>{container.state}</StatusChip>
      }
    >
      <Tabs.Root value={tab} onValueChange={setTab}>
        <div className={styles.toolbar}>
          <Tabs.List className={styles.tabs} aria-label="Container details">
            {tabs.map((title) => (
              <Tabs.Trigger className={styles.tab} value={title.toLowerCase()} key={title}>
                {title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <ContainerActions id={id} name={name} state={container.state} />
        </div>
        <div className={styles.content}>
          <Tabs.Content value="overview">
            <ContainerOverview container={container} />
          </Tabs.Content>
          <Tabs.Content value="stats">
            <ContainerStatsView id={id} />
          </Tabs.Content>
          <Tabs.Content value="ports">
            <ContainerPorts container={container} />
          </Tabs.Content>
          <Tabs.Content value="logs">
            <ContainerLogsView id={id} />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </AppContent>
  )
}
