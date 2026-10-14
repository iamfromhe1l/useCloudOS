import type { HTMLAttributes } from 'react'

import { cn } from './lib/cn'
export function TerminalPanel({ className, ...props }: HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      className={cn(
        'm-0 max-h-[60dvh] min-h-72 max-w-full overflow-auto rounded-shape-medium border border-outline-variant bg-surface-container-lowest p-4 font-mono text-body-small whitespace-pre [tab-size:2] text-on-surface',
        className,
      )}
      {...props}
    />
  )
}
