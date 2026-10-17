import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  EmptyState,
  ErrorState,
  Icon,
  InfoRow,
  MetricWidget,
  PillButton,
  Progress,
  Skeleton,
  Spinner,
  StatusChip,
  TextField,
  TonalSurface,
} from '@usecloud/ui'
import {
  AlertDialog,
  ContextMenu,
  ContextMenuContent,
  DropdownMenu,
  MenuContent,
  menuItemClass,
  Popover,
  PopoverContent,
} from '@usecloud/ui/overlays'

const meta = {
  title: 'Foundations/Design System 2.0',
  component: PillButton,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PillButton>
export default meta
type Story = StoryObj<typeof meta>
export const Overview: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-title-large font-semibold">useCloudOS · Material You OS</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricWidget label="Primary" value="12%" tone="primary" />
        <MetricWidget label="Secondary" value="3 GiB" tone="secondary" />
        <MetricWidget label="Tertiary" value="42 GiB" tone="tertiary" />
      </div>
      <div className="flex flex-wrap gap-2">
        <PillButton tone="primary">Primary</PillButton>
        <PillButton>Neutral</PillButton>
        <PillButton tone="quiet">Quiet</PillButton>
        <PillButton tone="danger">Destructive</PillButton>
        <PillButton disabled>Unavailable</PillButton>
        <PillButton disabled>
          <Spinner />
          Pending
        </PillButton>
        <PillButton iconOnly aria-label="Options">
          <Icon name="moreHoriz" className="size-5" />
        </PillButton>
      </div>
      <TextField label="Application name" placeholder="A clear accessible field" />
      <Progress value={42} label="Upload progress" />
      <div className="flex gap-2">
        <StatusChip tone="success">Running</StatusChip>
        <StatusChip tone="error">Failed</StatusChip>
      </div>
      <TonalSurface>
        <dl>
          <InfoRow label="Long value" value={'Long-technical-value-'.repeat(12)} mono />
        </dl>
      </TonalSurface>
      <Skeleton className="h-16" />
      <ErrorState message="Local, actionable failure" />
      <EmptyState title="Nothing here yet" message="An honest empty state, not invented data." />
    </div>
  ),
}
export const ObjectMenus: Story = {
  render: () => (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div className="rounded-shape-large bg-surface-container p-8">
          <p className="mb-4">Right-click here, or use the action menu.</p>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <PillButton>Object actions</PillButton>
            </DropdownMenu.Trigger>
            <MenuContent>
              <DropdownMenu.Item className={menuItemClass}>Open</DropdownMenu.Item>
              <DropdownMenu.Item disabled className={menuItemClass}>
                Unavailable
              </DropdownMenu.Item>
            </MenuContent>
          </DropdownMenu.Root>
        </div>
      </ContextMenu.Trigger>
      <ContextMenuContent>
        <ContextMenu.Item className={menuItemClass}>Open</ContextMenu.Item>
        <ContextMenu.Item className={menuItemClass + ' text-error'}>Remove</ContextMenu.Item>
      </ContextMenuContent>
    </ContextMenu.Root>
  ),
}
export const Popups: Story = {
  render: () => (
    <div className="flex gap-3">
      <Popover.Root>
        <Popover.Trigger asChild>
          <PillButton>Details popover</PillButton>
        </Popover.Trigger>
        <PopoverContent aria-label="Local details">
          <h2 className="text-title-medium">Local details</h2>
          <p className="mt-2 text-body-small">A focused transient surface.</p>
        </PopoverContent>
      </Popover.Root>
      <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
          <PillButton tone="danger">Confirm removal</PillButton>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-scrim/60" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-shape-extra-large bg-surface-container-high p-6 text-on-surface">
            <AlertDialog.Title>Remove this item?</AlertDialog.Title>
            <AlertDialog.Description>
              Demonstration only. Nothing will be removed.
            </AlertDialog.Description>
            <AlertDialog.Cancel asChild>
              <PillButton>Cancel</PillButton>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <PillButton tone="danger">Remove</PillButton>
            </AlertDialog.Action>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  ),
}
