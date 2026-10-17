import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { jsonResponse, renderPage } from '@/shared/test/render'

import { ContainersPage } from './ContainersPage'

afterEach(() => vi.unstubAllGlobals())

const container = {
  id: 'abc123',
  name: 'jellyfin',
  image: 'jellyfin/jellyfin:latest',
  state: 'running',
  status: 'Up 2 hours',
  created_at: '2026-10-06T12:00:00Z',
}

describe('ContainersPage', () => {
  it('renders the container list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => jsonResponse({ containers: [container] })),
    )
    renderPage(<ContainersPage />, '/containers')

    expect(await screen.findByRole('heading', { name: 'jellyfin' })).toBeInTheDocument()
    expect(screen.getByText('jellyfin/jellyfin:latest')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View details for jellyfin' })).toHaveAttribute(
      'href',
      '/containers/abc123',
    )
  })

  it('disables actions while a lifecycle mutation is pending', async () => {
    let finishMutation: (() => void) | undefined
    const mutationResponse = new Promise<Response>((resolve) => {
      finishMutation = () => resolve(new Response(null, { status: 204 }))
    })
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return mutationResponse
      return jsonResponse({ containers: [container] })
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPage(<ContainersPage />, '/containers')
    const user = userEvent.setup()

    const stopButton = await screen.findByRole('button', { name: 'Stop jellyfin' })
    await user.click(stopButton)
    expect(await screen.findByRole('button', { name: 'Stop jellyfin' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'More actions for jellyfin' })).toBeDisabled()

    finishMutation?.()
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/apps/containers/containers/abc123/stop',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
  })

  it('renders a readable API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        jsonResponse(
          { error: { code: 'DOCKER_UNAVAILABLE', message: 'Docker Engine is unavailable' } },
          503,
        ),
      ),
    )
    renderPage(<ContainersPage />, '/containers')

    expect(await screen.findByRole('alert')).toHaveTextContent('Docker is unavailable.')
  })
})
