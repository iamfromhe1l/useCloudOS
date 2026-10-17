import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { request } from '@/shared/api'
import { ErrorState, LoadingState, PillButton, StatusChip } from '@/shared/ui'
export function SessionSecurity() {
  const client = useQueryClient()
  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () =>
      request<{
        sessions: {
          id: string
          current: boolean
          createdAt: string
          expiresAt: string
          lastSeenAt: string
        }[]
      }>('/api/v1/sessions'),
  })
  const mutation = useMutation({
    mutationFn: (path: string) =>
      request<void>(path, { method: path === '/api/v1/logout' ? 'POST' : 'DELETE' }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['sessions'] })
      await client.invalidateQueries({ queryKey: ['session'] })
    },
  })
  return (
    <section className="space-y-4">
      <h2 className="text-title-large">Account security</h2>
      <p className="text-body-small">
        Sessions expire after 24 hours or 12 hours of inactivity. Development auth bypass has no
        browser session.
      </p>
      {sessions.isPending && <LoadingState />}
      {sessions.isError && <ErrorState message="Session list unavailable." />}
      <ul className="space-y-2">
        {sessions.data?.sessions.map((session) => (
          <li key={session.id} className="rounded-shape-medium bg-surface-container-high p-3">
            <p>{session.current && <StatusChip>Current session</StatusChip>}</p>
            <p className="text-body-small">
              Created {new Date(session.createdAt).toLocaleString()} · Expires{' '}
              {new Date(session.expiresAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <PillButton
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('/api/v1/sessions?others=1')}
        >
          Sign out other sessions
        </PillButton>
        <PillButton
          tone="quiet"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('/api/v1/logout')}
        >
          Sign out
        </PillButton>
      </div>
      {mutation.isError && <ErrorState message={mutation.error.message} />}
    </section>
  )
}
