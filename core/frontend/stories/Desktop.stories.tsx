import type { Meta, StoryObj } from '@storybook/react-vite'

import { AppIcon } from '@/entities/application'
import { MetricWidget } from '@/shared/ui'
import { DesktopAppIcon } from '@/widgets/desktop'
import { DesktopWidget, WidgetContent, WidgetHeader } from '@/widgets/desktop-widgets'
const meta = { title: 'Desktop/Widgets', component: DesktopWidget } satisfies Meta<
  typeof DesktopWidget
>
export default meta
type Story = StoryObj<typeof meta>
export const Resources: Story = {
  render: () => (
    <DesktopWidget>
      <WidgetHeader icon="memory" title="Resources" />
      <WidgetContent>
        <MetricWidget label="CPU" value="12.4%" detail="4 logical cores" progress={12.4} />
      </WidgetContent>
    </DesktopWidget>
  ),
}
export const Launcher: Story = {
  render: () => (
    <DesktopAppIcon
      application={{
        id: 'example',
        name: 'Example',
        icon: 'apps',
        colorRole: 'primary',
        availability: 'ready',
        dock: true,
        desktop: true,
        route: '/apps/example',
      }}
    />
  ),
}
export const ApplicationIdentity: Story = {
  render: () => (
    <AppIcon
      application={{
        id: 'settings',
        name: 'Settings',
        icon: 'settings',
        colorRole: 'secondary',
        availability: 'ready',
        dock: true,
        desktop: true,
        route: '/settings',
      }}
    />
  ),
}
