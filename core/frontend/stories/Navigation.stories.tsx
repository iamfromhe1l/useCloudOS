import type { Meta, StoryObj } from '@storybook/react-vite'

import { Dock } from '@/widgets/dock'
const meta = { title: 'Navigation/Dock', component: Dock } satisfies Meta<typeof Dock>
export default meta
type Story = StoryObj<typeof meta>
export const LauncherDock: Story = {}
