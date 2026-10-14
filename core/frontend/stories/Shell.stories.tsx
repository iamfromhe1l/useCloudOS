import type { Meta, StoryObj } from '@storybook/react-vite'

import { AppWindow } from '@/entities/application'
import { ControlCenter } from '@/widgets/control-center'
import { SettingsApp } from '@/widgets/settings-shell'
import { SystemBar } from '@/widgets/system-bar'
const meta = {
  title: 'Shell/Workspace',
  component: AppWindow,
  args: { appId: 'containers' },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppWindow>
export default meta
type Story = StoryObj<typeof meta>
export const SystemPanel: Story = { render: () => <SystemBar controlCenter={<ControlCenter />} /> }
export const ApplicationWindow: Story = {
  render: () => (
    <AppWindow appId="containers">
      <div className="p-6">Application content scrolls inside the workspace boundary.</div>
    </AppWindow>
  ),
}
export const ControlCenterPanel: Story = { render: () => <ControlCenter /> }
export const SettingsWindow: Story = { render: () => <SettingsApp /> }
