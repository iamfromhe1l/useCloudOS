import { execFileSync } from 'node:child_process'

import type { APIRequestContext, Page } from '@playwright/test'
export async function realSession(request: APIRequestContext, page: Page) {
  const api = 'http://127.0.0.1:8080'
  const session = await request.get(api + '/api/v1/session')
  if (session.status() === 401) {
    const password = execFileSync(
      'limactl',
      [
        'shell',
        '--workdir',
        '/',
        'usecloud-dev',
        '--',
        'sudo',
        'cat',
        '/data/platform/config/owner-password',
      ],
      { encoding: 'utf8' },
    ).trim()
    const login = await request.post(api + '/api/v1/login', {
      data: { username: 'owner', password },
    })
    if (login.status() !== 200) throw new Error('Development owner login failed')
  }
  await page.context().addCookies((await request.storageState()).cookies)
}
