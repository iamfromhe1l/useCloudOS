import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState, ErrorState, LoadingState } from '@usecloud/ui'

const meta = {
  title: 'Feedback/States',
  component: LoadingState,
} satisfies Meta<typeof LoadingState>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { render: () => <LoadingState /> }
export const Error: Story = {
  render: () => <ErrorState message="The requested information could not be loaded." />,
}
export const Empty: Story = {
  render: () => (
    <EmptyState title="Nothing here yet" message="Items will appear here when available." />
  ),
}
