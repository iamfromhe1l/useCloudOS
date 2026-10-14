import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react'

import { cn } from './lib/cn'

const variants = cva(
  'pill-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3.5 text-label-large font-semibold transition-[opacity,transform] duration-motion-short focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45',
  {
    variants: {
      tone: {
        primary:
          'border border-primary bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container',
        neutral:
          'border border-outline-variant/70 bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
        danger:
          'border border-error/40 bg-error-container/75 text-on-error-container hover:border-error',
        quiet:
          'border border-transparent bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
      },
      iconOnly: { true: 'size-11 min-h-11 p-0', false: '' },
    },
    defaultVariants: { tone: 'neutral', iconOnly: false },
  },
)

interface PillButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> {
  icon?: ReactNode
}

export function PillButton({
  children,
  className,
  tone,
  iconOnly,
  icon,
  ...props
}: PropsWithChildren<PillButtonProps>) {
  return (
    <button
      className={cn(
        variants({ tone, iconOnly }),
        'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
