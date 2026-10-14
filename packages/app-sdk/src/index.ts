export const HOST_CONTRACT_VERSION = 1 as const
export interface HostContext {
  version: typeof HOST_CONTRACT_VERSION
  applicationId: string
  route: string
  permissions: readonly string[]
  theme: { mode: 'dark' | 'light' }
  styles: readonly string[]
  navigation: { open: (appId: string) => void; setRoute: (path: string) => void }
  notifications: { push: (message: string) => Promise<void> }
  events: { subscribe: (listener: (event: HostEvent) => void) => () => void }
}
export interface HostEvent {
  type: string
  appId?: string
}
export interface ApplicationElement extends HTMLElement {
  host: HostContext
}
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
export function createUseCloudClient(applicationId: string) {
  if (!/^[a-z][a-z0-9-]*$/.test(applicationId)) throw new Error('Invalid application identity')
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      path.includes('..') ||
      path.includes('\\')
    )
      throw new Error('Application API path must be relative')
    const response = await fetch('/api/apps/' + applicationId + path, {
      ...init,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...init?.headers },
    })
    if (!response.ok) {
      let body: { error?: { code?: string; message?: string } } = {}
      try {
        body = (await response.json()) as typeof body
      } catch {
        /* stable error */
      }
      throw new ApiError(
        body.error?.message ?? 'Application request failed',
        response.status,
        body.error?.code ?? 'REQUEST_FAILED',
      )
    }
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
  return { request }
}
export function hasPermission(context: HostContext, permission: string) {
  return context.permissions.includes(permission)
}
