import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from './lib/cn'
export function TonalSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('min-w-0 rounded-shape-large bg-surface-container-high p-4', className)}
      {...props}
    />
  )
}
export function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-outline-variant py-2.5 text-body-medium last:border-0 medium:grid-cols-[minmax(6rem,0.4fr)_minmax(0,1fr)] medium:gap-4">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={cn('min-w-0 [overflow-wrap:anywhere]', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="my-4">
      <header className="mb-2.5">
        <h3 className="text-body-medium font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-body-small text-on-surface-variant">{description}</p>
        )}
      </header>
      <TonalSurface>{children}</TonalSurface>
    </section>
  )
}
