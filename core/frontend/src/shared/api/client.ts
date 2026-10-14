const apiBaseURL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseURL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let body: { error?: { message?: string; code?: string } } = {}
    try {
      body = (await response.json()) as typeof body
    } catch {
      // Keep a stable public error when an intermediary returns non-JSON.
    }
    throw new ApiError(
      body.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body.error?.code ?? 'REQUEST_FAILED',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
