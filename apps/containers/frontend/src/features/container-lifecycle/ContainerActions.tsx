import type { ContainerAction } from '@/entities/container'
import { ApiError } from '@/shared/api'
import { Icon, type IconName, PillButton } from '@/shared/ui'

import { useContainerAction } from './useContainerAction'

interface ContainerActionsProps {
  id: string
  name: string
  state: string
}

const labels: Record<ContainerAction, { idle: string; pending: string }> = {
  start: { idle: 'Start', pending: 'Starting...' },
  stop: { idle: 'Stop', pending: 'Stopping...' },
  restart: { idle: 'Restart', pending: 'Restarting...' },
}

const icons: Record<ContainerAction, IconName> = {
  start: 'playArrow',
  stop: 'stop',
  restart: 'restartAlt',
}

export function ContainerActions({ id, name, state }: ContainerActionsProps) {
  const mutation = useContainerAction(id)
  const pendingAction = mutation.isPending ? mutation.variables : undefined

  const run = (action: ContainerAction) => mutation.mutate(action)
  const actionLabel = (action: ContainerAction) =>
    pendingAction === action ? labels[action].pending : labels[action].idle

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions for ${name}`}>
        {state === 'running' ? (
          <>
            <PillButton
              type="button"
              tone="danger"
              aria-label={`Stop ${name}`}
              aria-busy={pendingAction === 'stop'}
              disabled={mutation.isPending}
              onClick={() => run('stop')}
              icon={<Icon name={icons.stop} className="size-4" />}
            >
              {actionLabel('stop')}
            </PillButton>
            <PillButton
              type="button"
              aria-label={`Restart ${name}`}
              aria-busy={pendingAction === 'restart'}
              disabled={mutation.isPending}
              onClick={() => run('restart')}
              icon={<Icon name={icons.restart} className="size-4" />}
            >
              {actionLabel('restart')}
            </PillButton>
          </>
        ) : (
          <PillButton
            type="button"
            tone="primary"
            aria-label={`Start ${name}`}
            aria-busy={pendingAction === 'start'}
            disabled={mutation.isPending}
            onClick={() => run('start')}
            icon={<Icon name={icons.start} className="size-4" />}
          >
            {actionLabel('start')}
          </PillButton>
        )}
      </div>
      {mutation.isError ? (
        <p role="alert" className="text-body-small text-error">
          {mutation.error instanceof ApiError ? mutation.error.message : 'Container action failed.'}
        </p>
      ) : null}
      {mutation.isPending ? (
        <p role="status" className="sr-only">
          {actionLabel(pendingAction!)}
        </p>
      ) : null}
    </div>
  )
}
