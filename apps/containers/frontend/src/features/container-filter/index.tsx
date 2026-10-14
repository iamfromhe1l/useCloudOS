import { useState } from 'react'

import type { ContainerSummary } from '@/entities/container'
import { SegmentedControl } from '@/shared/ui/selection'
export type ContainerFilter = 'all' | 'running' | 'stopped'
const options = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'stopped', label: 'Stopped' },
] as const
export function useContainerFilter(containers: ContainerSummary[]) {
  const [filter, setFilter] = useState<ContainerFilter>('all')
  const visible = containers.filter(
    (item) =>
      filter === 'all' ||
      (filter === 'running' ? item.state === 'running' : item.state !== 'running'),
  )
  return { filter, setFilter, visible }
}
export function ContainerFilters({
  value,
  onChange,
}: {
  value: ContainerFilter
  onChange: (value: ContainerFilter) => void
}) {
  return (
    <SegmentedControl
      label="Container filter"
      value={value}
      options={options}
      onChange={onChange}
    />
  )
}
