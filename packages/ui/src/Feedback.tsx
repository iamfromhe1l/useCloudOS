import type { HTMLAttributes } from 'react'

import { cn } from './lib/cn'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-shape-small bg-surface-container-highest', className)}
      {...props}
    />
  )
}
export function Spinner({ label = 'Working', className }: { label?: string; className?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none',
        className,
      )}
    />
  )
}
export function Progress({ value, label }: { value: number; label: string }) {
  const bounded = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={bounded}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 overflow-hidden rounded-full bg-primary-container"
    >
      <div className="h-full rounded-full bg-primary" style={{ width: bounded + '%' }} />
    </div>
  )
}
