import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'

import { ApiError, request } from '@/shared/api'
import { ErrorState, LoadingState, PillButton } from '@/shared/ui'
export function SessionGate({ children }: PropsWithChildren) {
  const session = useQuery({
    queryKey: ['session'],
    queryFn: () => request('/api/v1/session'),
    retry: false,
  })
  if (session.isPending) return <LoadingState message="Connecting to useCloudOS..." />
  if (session.error instanceof ApiError && session.error.status === 401) return <SignIn />
  if (session.isError)
    return <ErrorState message="Core is unavailable. Check the platform service." />
  return children
}
function SignIn() {
  const [username, setUsername] = useState('owner')
  const [password, setPassword] = useState('')
  const client = useQueryClient()
  const login = useMutation({
    mutationFn: () =>
      request('/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['session'] })
    },
  })
  return (
    <main className="mx-auto mt-24 max-w-md space-y-4 rounded-shape-large bg-surface-container p-6">
      <h1 className="text-title-large">Sign in to useCloudOS</h1>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          login.mutate()
        }}
      >
        <label className="block">
          Username
          <input
            className="mt-1 block w-full rounded-shape-small border border-outline bg-surface p-3"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="block">
          Password
          <input
            className="mt-1 block w-full rounded-shape-small border border-outline bg-surface p-3"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <PillButton disabled={login.isPending} type="submit">
          Sign in
        </PillButton>
        {login.isError && <ErrorState message="Sign in failed." />}
      </form>
    </main>
  )
}
