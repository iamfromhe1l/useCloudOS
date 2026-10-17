import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import type { HostContext } from '@usecloud/app-sdk'
import { AppContextProvider } from '@usecloud/app-sdk/react'
import { afterEach, expect, it, vi } from 'vitest'

import { formatBytes } from '@/entities/file-entry'

import { FileBrowser } from './FileBrowser'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
function view(permissions: string[] = ['storage.shared.read', 'storage.shared.write']) {
  const host: HostContext = {
    version: 1,
    applicationId: 'files',
    route: '/',
    permissions,
    theme: { mode: 'dark' },
    styles: [],
    navigation: { open: vi.fn(), setRoute: vi.fn() },
    notifications: { push: vi.fn() },
    events: { subscribe: () => () => {} },
  }
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AppContextProvider context={host}>
        <FileBrowser portal={document.body} />
      </AppContextProvider>
    </QueryClientProvider>,
  )
}
it('formats binary bytes', () => {
  expect(formatBytes(1024)).toBe('1 KiB')
  expect(formatBytes(0)).toBe('0 B')
})
it('renders empty storage and disables write actions for read-only root', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify(
            url.includes('/root')
              ? {
                  name: 'Shared storage',
                  writable: false,
                  availableBytes: 1024,
                  totalBytes: 2048,
                  maxUploadBytes: 4096,
                }
              : { entries: [], total: 0, offset: 0, limit: 100 },
          ),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    ),
  )
  view()
  expect(await screen.findByText('No files here')).toBeVisible()
  expect(screen.getByRole('button', { name: 'New folder' })).toBeDisabled()
})
it('handles storage errors and permission revocation without a blank screen', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: { code: 'PERMISSION_DENIED', message: 'Access denied' } }),
          { status: 403 },
        ),
    ),
  )
  view([])
  expect(screen.getByText(/Shared storage permission is required/)).toBeVisible()
})
