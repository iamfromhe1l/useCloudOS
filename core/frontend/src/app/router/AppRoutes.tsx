import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { LoadingState } from '@/shared/ui'

const DashboardPage = lazy(() =>
  import('@/pages/home').then((module) => ({ default: module.DashboardPage })),
)
const ApplicationPage = lazy(() =>
  import('@/pages/application').then((module) => ({ default: module.ApplicationPage })),
)
const StorePage = lazy(() =>
  import('@/pages/store').then((module) => ({ default: module.StorePage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings').then((module) => ({ default: module.SettingsPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/not-found').then((module) => ({ default: module.NotFoundPage })),
)

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState message="Loading page..." />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/apps/:appId/*" element={<ApplicationPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
