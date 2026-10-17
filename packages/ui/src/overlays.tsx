import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as ContextMenu from '@radix-ui/react-context-menu'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Popover from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'

import { cn } from './lib/cn'
import { usePortalContainer } from './PortalProvider'

export { AlertDialog, ContextMenu, Dialog, DropdownMenu, Popover }
export const menuItemClass =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-shape-small px-3 text-body-medium outline-none data-[highlighted]:bg-secondary-container data-[highlighted]:text-on-secondary-container data-[disabled]:pointer-events-none data-[disabled]:opacity-45'
export const menuSeparatorClass = 'my-1 h-px bg-outline-variant'
const surface =
  'uc-popup z-100 min-w-52 max-w-[calc(100vw-24px)] rounded-shape-medium border border-outline-variant bg-surface-container-high p-1.5 text-on-surface shadow-[0_8px_32px_var(--uc-shadow)/18%]'
export function MenuContent({ className, ...props }: ComponentProps<typeof DropdownMenu.Content>) {
  const container = usePortalContainer()
  return (
    <DropdownMenu.Portal container={container}>
      <DropdownMenu.Content
        sideOffset={6}
        collisionPadding={12}
        className={cn(surface, className)}
        {...props}
      />
    </DropdownMenu.Portal>
  )
}
export function ContextMenuContent({
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Content>) {
  const container = usePortalContainer()
  return (
    <ContextMenu.Portal container={container}>
      <ContextMenu.Content collisionPadding={12} className={cn(surface, className)} {...props} />
    </ContextMenu.Portal>
  )
}
export function PopoverContent({ className, ...props }: ComponentProps<typeof Popover.Content>) {
  const container = usePortalContainer()
  return (
    <Popover.Portal container={container}>
      <Popover.Content
        sideOffset={8}
        collisionPadding={12}
        className={cn(surface, 'p-4', className)}
        {...props}
      />
    </Popover.Portal>
  )
}
