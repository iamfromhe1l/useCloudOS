import { InstalledApplications } from '@/features/manage-apps'
import { PublisherTrust } from '@/features/publisher-trust'
import { SessionSecurity } from '@/features/session-security'

import { AppearanceSettings } from './AppearanceSettings'
import { SettingsShell } from './SettingsShell'
import { AboutSettings, AccessibilitySettings, ComingLater, SystemSettings } from './SystemSettings'
export function SettingsApp() {
  return (
    <SettingsShell
      sections={{
        appearance: <AppearanceSettings />,
        network: <ComingLater title="Network" />,
        storage: <ComingLater title="Storage" />,
        apps: <InstalledApplications />,
        users: (
          <div className="space-y-8">
            <SessionSecurity />
            <PublisherTrust />
          </div>
        ),
        accessibility: <AccessibilitySettings />,
        system: <SystemSettings />,
        about: <AboutSettings />,
      }}
    />
  )
}
