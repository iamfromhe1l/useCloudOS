import * as Toolbar from '@radix-ui/react-toolbar'
import { DropdownMenu, MenuContent, menuItemClass } from '@usecloud/ui/overlays'
import { useLocation, useNavigate } from 'react-router-dom'

import { type Application, useApplicationForPath } from '@/entities/application'
import { Icon, PillButton, Tooltip } from '@/shared/ui'

export function DockApplicationMenu({
  application,
  open,
  onOpenChange,
}: {
  application: Application
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const active = useApplicationForPath(useLocation().pathname).id === application.id
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <Tooltip label="Application actions">
        <DropdownMenu.Trigger asChild>
          <Toolbar.Button asChild>
            <PillButton iconOnly tone="quiet" aria-label="Application actions">
              <Icon name="moreHoriz" className="size-5" />
            </PillButton>
          </Toolbar.Button>
        </DropdownMenu.Trigger>
      </Tooltip>
      <MenuContent side="top" align="end">
        <DropdownMenu.Label className="px-3 py-2 text-label-medium text-on-surface-variant">
          {application.name}
        </DropdownMenu.Label>
        <DropdownMenu.Item
          disabled={!application.route}
          className={menuItemClass}
          onSelect={() => application.route && navigate(application.route)}
        >
          Open
        </DropdownMenu.Item>
        {active && application.id !== 'home' && (
          <DropdownMenu.Item className={menuItemClass} onSelect={() => navigate('/')}>
            Close application
          </DropdownMenu.Item>
        )}
        {application.installed && (
          <DropdownMenu.Item
            className={menuItemClass}
            onSelect={() => navigate('/settings?section=apps')}
          >
            Manage application
          </DropdownMenu.Item>
        )}
      </MenuContent>
    </DropdownMenu.Root>
  )
}
