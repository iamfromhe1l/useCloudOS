import { useContainerLogs } from '@/entities/container'
import { ErrorState, LoadingState, TerminalPanel } from '@/shared/ui'
export function ContainerLogsView({ id }: { id: string }) {
  const query = useContainerLogs(id)
  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorState message="Failed to load container logs." />
  return (
    <section aria-label="Container logs">
      {query.data.truncated && (
        <p role="status" className="mb-3 text-warning">
          Output truncated by the backend
        </p>
      )}
      <TerminalPanel tabIndex={0} aria-label="Container log output">
        {query.data.logs || 'No log output.'}
      </TerminalPanel>
    </section>
  )
}
