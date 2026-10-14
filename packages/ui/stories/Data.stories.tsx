import type { Meta, StoryObj } from '@storybook/react-vite'
import { MetricWidget, StatusChip, TerminalPanel } from '@usecloud/ui'
const meta = { title: 'Data display/Technical values', component: TerminalPanel } satisfies Meta<
  typeof TerminalPanel
>
export default meta
type Story = StoryObj<typeof meta>
export const Terminal: Story = {
  render: () => <TerminalPanel>$ service ready{'\n'}listening on :8080</TerminalPanel>,
}
export const Status: Story = { render: () => <StatusChip tone="success">Running</StatusChip> }
export const Metric: Story = {
  render: () => (
    <MetricWidget label="Memory" value="3 GB" detail="5 GB available" tone="secondary" />
  ),
}
