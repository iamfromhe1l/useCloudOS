import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { ErrorState, OverflowText, PillButton, Progress, StatusChip, TextField } from '../src/index'
import { SegmentedControl, Switch } from '../src/selection'
describe('public UI behavior', () => {
  it('keeps static identity noninteractive and fields/progress accessible', () => {
    render(
      <>
        <h1>
          <OverflowText text="Application identity" />
        </h1>
        <TextField label="Search" />
        <Progress value={140} label="Transfer" />
      </>,
    )
    expect(screen.queryByRole('button', { name: 'Application identity' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeVisible()
    expect(screen.getByRole('progressbar', { name: 'Transfer' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })
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
