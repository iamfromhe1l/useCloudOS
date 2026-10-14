import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon, PillButton } from '@usecloud/ui'
import { SegmentedControl, Switch } from '@usecloud/ui/selection'
import { useState } from 'react'
const meta = { title: 'Controls/Pill button', component: PillButton } satisfies Meta<
  typeof PillButton
>
export default meta
type Story = StoryObj<typeof meta>
export const Actions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PillButton tone="primary" icon={<Icon name="playArrow" className="size-4" />}>
        Start
      </PillButton>
      <PillButton>Restart</PillButton>
      <PillButton tone="danger">Stop</PillButton>
      <PillButton disabled>Disabled</PillButton>
    </div>
  ),
}
function Controls() {
  const [value, setValue] = useState('dark')
  const [enabled, setEnabled] = useState(false)
  return (
    <div className="space-y-4">
      <SegmentedControl
        label="Mode"
        value={value}
        onChange={setValue}
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
        ]}
      />
      <Switch label="Reduce transparency" checked={enabled} onCheckedChange={setEnabled} />
    </div>
  )
}
export const SettingsControls: Story = { render: () => <Controls /> }
