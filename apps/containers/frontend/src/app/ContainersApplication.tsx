import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppContext } from '@usecloud/app-sdk/react'
import { PortalProvider } from '@usecloud/ui'
import { useEffect, useState } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { ContainerDetailsPage } from '@/pages/container-details'
import { ContainersPage } from '@/pages/containers'
function ReportRoute() {
  const location = useLocation()
  const host = useAppContext()
  useEffect(() => {
    host.navigation.setRoute(location.pathname.replace(/^\/containers/, '') || '/')
  }, [location.pathname, host.navigation])
  return null
}
export function ContainersApplication({ portalContainer }: { portalContainer: HTMLElement }) {
  const host = useAppContext()
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5000 } } }),
  )
  return (
    <PortalProvider container={portalContainer}>
      <QueryClientProvider client={client}>
        <MemoryRouter
          key={host.route}
          initialEntries={['/containers' + (host.route === '/' ? '' : host.route)]}
        >
          <ReportRoute />
          <Routes>
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/containers/:id" element={<ContainerDetailsPage />} />
            <Route path="*" element={<p role="alert">Container view not found.</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </PortalProvider>
  )
}
