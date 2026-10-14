import type { ComponentProps } from 'react'

import { Icon } from '@/shared/ui'
export function ControlCenterTrigger(props: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-label="Open control center"
      aria-haspopup="dialog"
      className="grid size-9 place-items-center rounded-full bg-secondary-container text-on-secondary-container"
      {...props}
    >
      <Icon name="tune" className="size-5" />
    </button>
  )
}
