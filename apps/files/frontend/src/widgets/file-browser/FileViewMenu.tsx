import { Icon, PillButton } from '@usecloud/ui'
import {
  DropdownMenu as Menu,
  MenuContent,
  menuItemClass,
  menuSeparatorClass,
} from '@usecloud/ui/overlays'

export function FileViewMenu({
  sort,
  setSort,
  hidden,
  setHidden,
}: {
  sort: string
  setSort: (value: string) => void
  hidden: boolean
  setHidden: (value: boolean) => void
}) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <PillButton tone="quiet" icon={<Icon name="tune" className="size-5" />}>
          View
        </PillButton>
      </Menu.Trigger>
      <MenuContent align="end">
        <Menu.Label className="px-3 py-2 text-label-medium text-on-surface-variant">
          Sort by
        </Menu.Label>
        <Menu.RadioGroup value={sort} onValueChange={setSort}>
          {[
            ['name', 'Name'],
            ['modified', 'Modified'],
            ['size', 'Size'],
            ['type', 'Type'],
          ].map(([value, label]) => (
            <Menu.RadioItem key={value} value={value!} className={menuItemClass}>
              <span className="size-4">
                {sort === value && <Icon name="checkCircle" className="size-4" />}
              </span>
              {label}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
        <Menu.Separator className={menuSeparatorClass} />
        <Menu.CheckboxItem checked={hidden} onCheckedChange={setHidden} className={menuItemClass}>
          <span className="size-4">{hidden && <Icon name="checkCircle" className="size-4" />}</span>
          Show hidden files
        </Menu.CheckboxItem>
      </MenuContent>
    </Menu.Root>
  )
}
