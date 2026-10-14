import { InstalledApplications } from '@/features/manage-apps'

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
        users: <ComingLater title="Users" />,
        accessibility: <AccessibilitySettings />,
        system: <SystemSettings />,
        about: <AboutSettings />,
      }}
    />
  )
}
