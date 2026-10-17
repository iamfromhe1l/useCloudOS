import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'

import { ApiError, request } from '@/shared/api'
import { ErrorState, Icon, LoadingState, PillButton, Spinner, TextField } from '@/shared/ui'
export function SessionGate({ children }: PropsWithChildren) {
  const session = useQuery({
    queryKey: ['session'],
    queryFn: () => request('/api/v1/session'),
    retry: false,
    refetchInterval: 60_000,
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
    <main className="grid min-h-dvh place-items-center p-5">
      <section className="w-full max-w-sm space-y-7 rounded-shape-extra-large border border-outline-variant bg-surface-container-low p-7 shadow-[var(--elevation-window)] sm:p-8">
        <header className="text-center">
          <span className="mx-auto mb-5 grid size-16 place-items-center rounded-shape-large bg-primary-container text-on-primary-container">
            <Icon name="cloud" className="size-9" />
          </span>
          <p className="mb-2 text-label-large text-on-surface-variant">useCloudOS</p>
          <h1 className="text-headline-small font-semibold">Welcome home</h1>
          <p className="mt-2 text-body-small text-on-surface-variant">
            Sign in to your personal cloud
          </p>
        </header>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            login.mutate()
          }}
        >
          <TextField
            label="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PillButton
            className="w-full"
            tone="primary"
            disabled={login.isPending || !username || !password}
            type="submit"
            aria-busy={login.isPending}
          >
            {login.isPending && <Spinner />} {login.isPending ? 'Signing in…' : 'Sign in'}
          </PillButton>
          {login.isError && (
            <ErrorState
              title="Could not sign in"
              message="Check your username and password, then try again."
            />
          )}
        </form>
      </section>
    </main>
  )
}
