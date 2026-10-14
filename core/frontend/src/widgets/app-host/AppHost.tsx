import type { ApplicationElement, HostContext } from '@usecloud/app-sdk'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { type InstalledApplication, useApplications } from '@/entities/application'
import { request } from '@/shared/api'
import { useTheme } from '@/shared/config/theme'
import { ErrorState, LoadingState, RetryAction } from '@/shared/ui'
const modules = new Map<string, Promise<unknown>>()
function loadModule(url: string) {
  let pending = modules.get(url)
  if (!pending) {
    pending = import(/* @vite-ignore */ url).catch((error) => {
      modules.delete(url)
      throw error
    })
    modules.set(url, pending)
  }
  return pending
}
export function AppHost({
  application,
  route,
}: {
  application: InstalledApplication
  route: string
}) {
  const mount = useRef<HTMLDivElement>(null)
  const element = useRef<ApplicationElement | null>(null)
  const [failure, setFailure] = useState(false)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const navigate = useNavigate()
  const applications = useApplications()
  const { resolvedMode } = useTheme()
  const m = application.manifest
  const base = '/app-assets/' + m.metadata.id + '/' + m.metadata.version + '/'
  const navigation = useMemo(
    () => ({
      open: (id: string) => {
        const app = applications.find((a) => a.id === id)
        if (app?.route) navigate(app.route)
      },
      setRoute: (path: string) => {
        if (path.startsWith('/') && !path.startsWith('//') && !path.includes('..'))
          navigate('/apps/' + m.metadata.id + (path === '/' ? '' : path))
      },
    }),
    [navigate, m.metadata.id, applications],
  )
  const host: HostContext = useMemo(
    () => ({
      version: 1,
      applicationId: m.metadata.id,
      route,
      permissions: application.grants,
      theme: { mode: resolvedMode },
      styles: (m.frontend?.type === 'web-component' ? (m.frontend.styles ?? []) : []).map(
        (p) => base + p,
      ),
      navigation,
      notifications: {
        push: (message: string) =>
          request<void>('/api/v1/apps/' + m.metadata.id + '/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          }),
      },
      events: {
        subscribe: (listener) => {
          const source = new EventSource('/api/v1/events')
          source.onmessage = (event) => {
            try {
              listener(JSON.parse(event.data))
            } catch {
              /* ignore malformed events */
            }
          }
          return () => source.close()
        },
      },
    }),
    [m, base, navigation, route, application.grants, resolvedMode],
  )
  const context = useRef(host)
  useEffect(() => {
    context.current = host
    if (element.current) element.current.host = host
  }, [host])
  useEffect(() => {
    let active = true
    setLoading(true)
    setFailure(false)
    const frontend = m.frontend
    if (!frontend || frontend.type !== 'web-component') {
      setLoading(false)
      return
    }
    const onError = () => setFailure(true)
    async function mountApplication() {
      try {
        if (!frontend || frontend.type !== 'web-component') return
        await loadModule(base + frontend.entry)
        await Promise.race([
          customElements.whenDefined(frontend.element),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Registration timeout')), 10_000),
          ),
        ])
        if (!active) return
        const app = document.createElement(frontend.element) as ApplicationElement
        app.host = context.current
        app.addEventListener('usecloud:app-error', onError)
        element.current = app
        mount.current?.replaceChildren(app)
        setLoading(false)
      } catch {
        if (active) {
          setFailure(true)
          setLoading(false)
        }
      }
    }
    void mountApplication()
    return () => {
      active = false
      element.current?.removeEventListener('usecloud:app-error', onError)
      element.current?.remove()
      element.current = null
    }
  }, [base, m.frontend, attempt])
  if (m.frontend?.type === 'external')
    return (
      <div className="p-6">
        <a
          href={m.frontend.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Open {m.metadata.name} in its own interface
        </a>
      </div>
    )
  return (
    <div className="min-w-0">
      {loading && <LoadingState message="Loading application..." />}
      {failure && (
        <ErrorState
          message="Application failed to load. The desktop remains available."
          action={<RetryAction onRetry={() => setAttempt((value) => value + 1)} />}
        />
      )}
      <div ref={mount} hidden={failure} data-app-host={m.metadata.id} />
    </div>
  )
}
