import {
  Component,
  type ComponentType,
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useContext,
} from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { type ApplicationElement, HOST_CONTRACT_VERSION, type HostContext } from './index.js'
const Context = createContext<HostContext | null>(null)
export function AppContextProvider({
  context,
  children,
}: PropsWithChildren<{ context: HostContext }>) {
  return <Context.Provider value={context}>{children}</Context.Provider>
}
export function useAppContext() {
  const value = useContext(Context)
  if (!value) throw new Error('Application host context required')
  return value
}
export function usePermission(permission: string) {
  return useAppContext().permissions.includes(permission)
}
export function useHostTheme() {
  return useAppContext().theme
}
export function useHostNavigation() {
  return useAppContext().navigation
}
class ApplicationBoundary extends Component<
  PropsWithChildren<{ onError: (error: Error) => void }>,
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    this.props.onError(error)
  }
  render(): ReactNode {
    return this.state.failed ? (
      <p role="alert">Application failed to render.</p>
    ) : (
      this.props.children
    )
  }
}
/** React is private to the app artifact; the browser boundary is a Custom Element. */
export function registerReactApplication({
  element,
  Application,
  styles,
}: {
  element: string
  Application: ComponentType<{ portalContainer: HTMLElement }>
  styles: string
}) {
  if (customElements.get(element)) return
  class ReactApplication extends HTMLElement implements ApplicationElement {
    private context?: HostContext
    private root?: Root
    private mount: HTMLDivElement
    private portals: HTMLDivElement
    constructor() {
      super()
      const shadow = this.attachShadow({ mode: 'open' })
      const style = document.createElement('style')
      style.textContent = styles
      this.mount = document.createElement('div')
      this.mount.className = 'usecloud-app-root'
      this.portals = document.createElement('div')
      shadow.append(style, this.mount, this.portals)
    }
    set host(value: HostContext) {
      if (value.version !== HOST_CONTRACT_VERSION) throw new Error('Unsupported host contract')
      if (!this.context) {
        for (const href of value.styles) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = href
          this.shadowRoot?.prepend(link)
        }
      }
      this.context = value
      this.renderApplication()
    }
    get host() {
      if (!this.context) throw new Error('Host context unavailable')
      return this.context
    }
    connectedCallback() {
      this.renderApplication()
    }
    disconnectedCallback() {
      queueMicrotask(() => {
        if (!this.isConnected) {
          this.root?.unmount()
          this.root = undefined
        }
      })
    }
    private renderApplication() {
      if (!this.isConnected || !this.context) return
      this.root ??= createRoot(this.mount)
      this.root.render(
        <ApplicationBoundary
          onError={(error) =>
            this.dispatchEvent(
              new CustomEvent('usecloud:app-error', {
                detail: { message: error.message },
                bubbles: true,
                composed: true,
              }),
            )
          }
        >
          <AppContextProvider context={this.context}>
            <Application portalContainer={this.portals} />
          </AppContextProvider>
        </ApplicationBoundary>,
      )
    }
  }
  customElements.define(element, ReactApplication)
}
