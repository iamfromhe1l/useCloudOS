import { type InputHTMLAttributes, useId } from 'react'

import { cn } from './lib/cn'

export function TextField({
  label,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const generated = useId()
  return (
    <label htmlFor={id ?? generated} className="block min-w-0 space-y-2 text-label-large">
      <span>{label}</span>
      <input
        id={id ?? generated}
        className={cn(
          'min-h-11 w-full rounded-shape-medium border border-outline-variant bg-surface-container-lowest px-3.5 text-body-medium text-on-surface placeholder:text-on-surface-variant disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </label>
  )
}
