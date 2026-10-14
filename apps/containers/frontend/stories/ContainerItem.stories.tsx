import type { Meta, StoryObj } from '@storybook/react-vite'

import { ContainerItem } from '@/entities/container'
const meta = { title: 'Applications/Container item', component: ContainerItem } satisfies Meta<
  typeof ContainerItem
>
export default meta
type Story = StoryObj<typeof meta>
export const Running: Story = {
  args: {
    container: {
      id: 'story-container',
      name: 'Jellyfin',
      image: 'jellyfin/jellyfin:latest',
      state: 'running',
      status: 'Up 2 hours',
      created_at: '2026-10-06T12:00:00Z',
    },
  },
}
