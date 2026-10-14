import { SessionGate } from '@/features/sign-in'
import { ShellErrorBoundary } from '@/shared/ui/ErrorBoundary'

import { AppRoutes } from './router/AppRoutes'
import { AppShell } from './shell'

export function App() {
  return (
    <ShellErrorBoundary>
      <SessionGate>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </SessionGate>
    </ShellErrorBoundary>
  )
}
