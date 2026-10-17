import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { ErrorState, PillButton, StatusChip } from '../src/index'
import { SegmentedControl, Switch } from '../src/selection'
describe('public UI behavior', () => {
  it('provides accessible native actions and feedback', () => {
    render(
      <>
        <PillButton disabled>Stop</PillButton>
        <StatusChip tone="success">Running</StatusChip>
        <ErrorState message="Unavailable" />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Unavailable')
  })
  it('delegates switch/selection state to accessible primitives', async () => {
    function Controls() {
      const [checked, setChecked] = useState(false)
      const [mode, setMode] = useState('dark')
      return (
        <>
          <Switch label="Transparency" checked={checked} onCheckedChange={setChecked} />
          <SegmentedControl
            label="Theme"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
        </>
      )
    }
    render(<Controls />)
    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true')
  })
})
