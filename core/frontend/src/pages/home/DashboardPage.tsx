import { Desktop, DesktopApplications, DesktopGrid } from '@/widgets/desktop'
import {
  ApplicationsWidget,
  ResourceWidget,
  ServerWidget,
  StorageWidget,
  SystemWidget,
} from '@/widgets/desktop-widgets'
export function DashboardPage() {
  return (
    <Desktop>
      <h1 className="sr-only">Home</h1>
      <DesktopGrid
        server={<ServerWidget />}
        resources={<ResourceWidget />}
        storage={<StorageWidget />}
        docker={<ApplicationsWidget />}
        system={<SystemWidget />}
      />
      <DesktopApplications />
    </Desktop>
  )
}
