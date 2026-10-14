import type { Meta, StoryObj } from '@storybook/react-vite'

import { ColorSeedSelector } from '@/features/accent-selector'
import { WallpaperSelector } from '@/features/wallpaper'
const meta = { title: 'Foundations/Appearance', component: ColorSeedSelector } satisfies Meta<
  typeof ColorSeedSelector
>
export default meta
type Story = StoryObj<typeof meta>
export const AccentSeeds: Story = {}
export const Wallpaper: Story = {
  render: () => (
    <div className="max-w-xl">
      <WallpaperSelector />
    </div>
  ),
}
