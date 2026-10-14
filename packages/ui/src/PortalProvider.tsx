import { createContext, type PropsWithChildren, useContext } from 'react'
const PortalContext = createContext<HTMLElement | undefined>(undefined)
export function PortalProvider({
  container,
  children,
}: PropsWithChildren<{ container?: HTMLElement }>) {
  return <PortalContext.Provider value={container}>{children}</PortalContext.Provider>
}
export function usePortalContainer() {
  return useContext(PortalContext)
}
