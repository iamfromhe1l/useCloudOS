import { cva, type VariantProps } from 'class-variance-authority'
import type { PropsWithChildren } from 'react'

import { cn } from './lib/cn'

const variants = cva(
  'status-chip inline-flex min-h-7 max-w-full items-center gap-2 rounded-full px-2.5 py-1 text-label-medium font-semibold [overflow-wrap:anywhere]',
  {
    variants: {
      tone: {
        success: 'bg-success-container text-on-success-container',
        warning: 'bg-warning-container text-on-warning-container',
        error: 'bg-error-container text-on-error-container',
        info: 'bg-info-container text-on-info-container',
        neutral: 'bg-surface-container-highest text-on-surface-variant',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

interface StatusChipProps extends VariantProps<typeof variants> {
  className?: string
}

export function StatusChip({ children, tone, className }: PropsWithChildren<StatusChipProps>) {
  return (
    <span className={cn(variants({ tone }), className)}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  )
}
