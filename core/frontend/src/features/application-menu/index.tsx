import {
  ContextMenu,
  ContextMenuContent,
  DropdownMenu,
  MenuContent,
  menuItemClass,
} from '@usecloud/ui/overlays'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Application } from '@/entities/application'
import { Icon, PillButton } from '@/shared/ui'

export function ApplicationMenu({
  application,
  children,
}: {
  application: Application
  children: ReactElement
}) {
  const navigate = useNavigate()
  const items = (context: boolean) => {
    const Menu = context ? ContextMenu : DropdownMenu
    return (
      <>
        <Menu.Label className="px-3 py-2 text-label-medium text-on-surface-variant">
          {application.name}
        </Menu.Label>
        <Menu.Item
          className={menuItemClass}
          onSelect={() => application.route && navigate(application.route)}
        >
          Open
        </Menu.Item>
        {application.installed && (
          <Menu.Item className={menuItemClass} onSelect={() => navigate('/settings?section=apps')}>
            Manage in Settings
          </Menu.Item>
        )}
      </>
    )
  }
  return (
    <ContextMenu.Root>
      <div className="group relative">
        <ContextMenu.Trigger asChild>
          <div>{children}</div>
        </ContextMenu.Trigger>
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <PillButton
                iconOnly
                tone="neutral"
                className="!size-11 !min-h-11 !rounded-full"
                aria-label={'Actions for ' + application.name}
              >
                <Icon name="moreHoriz" className="size-4" />
              </PillButton>
            </DropdownMenu.Trigger>
            <MenuContent>{items(false)}</MenuContent>
          </DropdownMenu.Root>
        </div>
      </div>
      <ContextMenuContent>{items(true)}</ContextMenuContent>
    </ContextMenu.Root>
  )
}
