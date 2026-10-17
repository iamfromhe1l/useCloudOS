import { SessionGate } from '@/features/sign-in'
import { ShellErrorBoundary } from '@/shared/ui/ErrorBoundary'

import { AppRoutes } from './router/AppRoutes'
import { AppShell } from './shell'
import { WallpaperBackground } from './shell/WallpaperBackground'

export function App() {
  return (
    <ShellErrorBoundary>
      <div className="relative isolate min-h-dvh">
        <WallpaperBackground />
        <SessionGate>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </SessionGate>
      </div>
    </ShellErrorBoundary>
  )
}
