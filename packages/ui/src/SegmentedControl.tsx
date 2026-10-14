import * as ToggleGroup from '@radix-ui/react-toggle-group'

import { cn } from './lib/cn'
interface Segment<T extends string> {
  value: T
  label: string
}
interface Props<T extends string> {
  disabled?: boolean
  label: string
  value: T
  options: readonly Segment<T>[]
  onChange: (value: T) => void
  className?: string
}
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  disabled,
}: Props<T>) {
  const change = (next: string) => {
    const option = options.find((item) => item.value === next)
    if (option) onChange(option.value)
  }
  return (
    <ToggleGroup.Root
      disabled={disabled}
      type="single"
      aria-label={label}
      value={value}
      onValueChange={change}
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-full border border-outline-variant bg-surface-container-high p-1',
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className="min-h-11 rounded-full border-0 bg-transparent px-4 text-label-large font-semibold text-on-surface-variant data-[state=on]:bg-secondary-container data-[state=on]:text-on-secondary-container"
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
