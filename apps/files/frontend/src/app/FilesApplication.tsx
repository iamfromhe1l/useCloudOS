import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PortalProvider } from '@usecloud/ui'
import { useState } from 'react'

import { FilesPage } from '@/pages/files'
export function FilesApplication({ portalContainer }: { portalContainer: HTMLElement }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 5000 }, mutations: { retry: false } },
      }),
  )
  return (
    <QueryClientProvider client={client}>
      <PortalProvider container={portalContainer}>
        <FilesPage portal={portalContainer} />
      </PortalProvider>
    </QueryClientProvider>
  )
}
