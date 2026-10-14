import './style.css'

import { registerReactApplication, useAppContext, useHostTheme } from '@usecloud/app-sdk/react'
import { PillButton, PortalProvider, TonalSurface } from '@usecloud/ui'
function Hello({ portalContainer }: { portalContainer: HTMLElement }) {
  const host = useAppContext()
  const theme = useHostTheme()
  return (
    <PortalProvider container={portalContainer}>
      <div className="space-y-4 p-5">
        <TonalSurface>
          <h2 className="text-title-medium">Independent application</h2>
          <p>This content belongs to Hello. Desktop and window chrome belong to Core.</p>
          <p>
            Host version: {host.version} · Theme: {theme.mode}
          </p>
        </TonalSurface>
        <PillButton onClick={() => host.navigation.open('settings')}>Open Settings</PillButton>
      </div>
    </PortalProvider>
  )
}
registerReactApplication({ element: 'usecloud-hello-v0-1-0', Application: Hello, styles: '' })
