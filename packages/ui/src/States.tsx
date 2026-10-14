import type { ReactNode } from 'react'

const surface =
  'flex min-h-14 min-w-0 items-center gap-2.5 rounded-shape-medium border border-outline-variant bg-surface-container p-3 [overflow-wrap:anywhere]'
import { Icon } from './Icon'
import { cn } from './lib/cn'
import { PillButton } from './PillButton'

interface StateProps {
  title?: string
  message?: string
  action?: ReactNode
}

export function LoadingState({ message = 'Loading...' }: Pick<StateProps, 'message'>) {
  return (
    <div role="status" className={cn(surface, 'text-on-surface-variant')}>
      <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

export function ErrorState({
  title = 'Unable to load',
  message = 'Failed to load data.',
  action,
}: StateProps) {
  return (
    <div
      role="alert"
      className={cn(surface, 'border-error/30 bg-error-container/55 text-on-error-container')}
    >
      <Icon name="error" className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-body-small">{message}</p>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', message, action }: StateProps) {
  return (
    <div className="rounded-shape-large border border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
      <Icon name="info" className="mx-auto size-6 text-on-surface-variant" />
      <h2 className="mt-3 text-title-medium font-semibold text-on-surface">{title}</h2>
      {message ? (
        <p className="mx-auto mt-2 max-w-md text-body-medium text-on-surface-variant">{message}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function RetryAction({ onRetry }: { onRetry: () => void }) {
  return (
    <PillButton tone="quiet" onClick={onRetry} icon={<Icon name="refresh" className="size-4" />}>
      Retry
    </PillButton>
  )
}
