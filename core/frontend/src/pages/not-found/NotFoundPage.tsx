import { Link } from 'react-router-dom'

import { AppWindow } from '@/entities/application'
import { EmptyState } from '@/shared/ui'
export function NotFoundPage() {
  return (
    <AppWindow appId="home" title="Application not found">
      <div className="p-6">
        <EmptyState
          title="This destination is unavailable"
          message="Return to your desktop to open an available application."
          action={
            <Link to="/" className="text-primary underline">
              Return Home
            </Link>
          }
        />
      </div>
    </AppWindow>
  )
}
