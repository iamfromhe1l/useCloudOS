import {
  ContextMenu,
  ContextMenuContent,
  DropdownMenu,
  MenuContent,
  menuItemClass,
  menuSeparatorClass,
} from '@usecloud/ui/overlays'
import { type ReactElement, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import type { ContainerAction } from '@/entities/container'
import { Icon, PillButton, Spinner } from '@/shared/ui'

import { useContainerAction } from './useContainerAction'
interface Props {
  id: string
  name: string
  state: string
  children?: (controls: ReactNode) => ReactElement
}
export function ContainerActions({ id, name, state, children }: Props) {
  const mutation = useContainerAction(id)
  const navigate = useNavigate()
  const running = state === 'running'
  const primary = running ? 'stop' : 'start'
  const run = (action: ContainerAction) => mutation.mutate(action)
  const view = (segment = '') => navigate('/containers/' + encodeURIComponent(id) + segment)
  const items = (context: boolean) => {
    const Menu = context ? ContextMenu : DropdownMenu
    return (
      <>
        <Menu.Label className="max-w-64 truncate px-3 py-2 text-label-medium text-on-surface-variant">
          {name}
        </Menu.Label>
        <Menu.Item className={menuItemClass} onSelect={() => view()}>
          Open details
        </Menu.Item>
        <Menu.Item className={menuItemClass} onSelect={() => view('?tab=logs')}>
          Logs
        </Menu.Item>
        <Menu.Separator className={menuSeparatorClass} />
        <Menu.Item
          className={menuItemClass}
          disabled={mutation.isPending}
          onSelect={() => run('restart')}
        >
          Restart
        </Menu.Item>
        <Menu.Item
          className={menuItemClass + (running ? ' text-error' : '')}
          disabled={mutation.isPending}
          onSelect={() => run(primary)}
        >
          {running ? 'Stop' : 'Start'}
        </Menu.Item>
      </>
    )
  }
  const controls = (
    <div className="space-y-1">
      <div className="flex gap-2" role="group" aria-label={'Actions for ' + name}>
        <PillButton
          tone={running ? 'quiet' : 'primary'}
          aria-label={(running ? 'Stop ' : 'Start ') + name}
          disabled={mutation.isPending}
          aria-busy={mutation.isPending}
          onClick={() => run(primary)}
          icon={
            mutation.isPending ? (
              <Spinner />
            ) : (
              <Icon name={running ? 'stop' : 'playArrow'} className="size-4" />
            )
          }
        >
          {mutation.isPending ? 'Applying…' : running ? 'Stop' : 'Start'}
        </PillButton>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <PillButton
              iconOnly
              tone="quiet"
              disabled={mutation.isPending}
              aria-label={'More actions for ' + name}
            >
              <Icon name="moreHoriz" className="size-5" />
            </PillButton>
          </DropdownMenu.Trigger>
          <MenuContent align="end">{items(false)}</MenuContent>
        </DropdownMenu.Root>
      </div>
      {mutation.isError && (
        <p role="alert" className="text-body-small text-error">
          {mutation.error.message}
        </p>
      )}
    </div>
  )
  if (!children) return controls
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div>{children(controls)}</div>
      </ContextMenu.Trigger>
      <ContextMenuContent>{items(true)}</ContextMenuContent>
    </ContextMenu.Root>
  )
}
