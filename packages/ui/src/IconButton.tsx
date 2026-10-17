import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { PillButton } from './PillButton'
export function IconButton({
  label,
  icon,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { label: string; icon: ReactNode }) {
  return (
    <PillButton {...props} iconOnly tone="quiet" aria-label={label}>
      {icon}
    </PillButton>
  )
}
