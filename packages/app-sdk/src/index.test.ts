import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, createUseCloudClient, hasPermission, type HostContext } from './index'
afterEach(() => vi.unstubAllGlobals())
describe('versioned SDK', () => {
  it('routes through Core and handles domain errors', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { code: 'DENIED', message: 'Denied' } }), {
          status: 403,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    await expect(createUseCloudClient('hello').request('/items')).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/apps/hello/items',
      expect.objectContaining({ credentials: 'same-origin' }),
    )
  })
  it('rejects escape paths', async () => {
    const client = createUseCloudClient('hello')
    for (const path of ['https://remote', '//remote', '/../secret'])
      await expect(client.request(path)).rejects.toThrow('relative')
  })
  it('capability checks are only UX', () => {
    expect(hasPermission({ permissions: ['system.read'] } as HostContext, 'system.read')).toBe(true)
    expect(hasPermission({ permissions: [] } as unknown as HostContext, 'docker.manage')).toBe(
      false,
    )
  })
})
