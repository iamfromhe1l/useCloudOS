import { OverflowText } from '@usecloud/ui'
import type { PropsWithChildren, ReactNode } from 'react'
interface Props extends PropsWithChildren {
  title?: string
  subtitle?: string
  leading?: ReactNode
  actions?: ReactNode
}
/** Interior view only. Core owns outer window identity, bounds and chrome. */
export function AppContent({ title, subtitle, leading, actions, children }: Props) {
  return (
    <div className="min-w-0">
      {(title || subtitle || actions || leading) && (
        <header className="flex min-w-0 flex-wrap items-center gap-3 border-b border-outline-variant p-4">
          {leading}
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-title-medium font-semibold">
                <OverflowText text={title} />
              </h2>
            )}
            {subtitle && (
              <p className="text-body-small text-on-surface-variant">
                <OverflowText text={subtitle} />
              </p>
            )}
          </div>
          {actions}
        </header>
      )}
      {children}
    </div>
  )
}
