import * as Primitive from '@radix-ui/react-switch'

export function Switch({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <Primitive.Root
      disabled={disabled}
      aria-label={label}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="group flex h-11 w-13 shrink-0 items-center rounded-full border-2 border-outline bg-surface-container-highest data-[state=checked]:border-primary data-[state=checked]:bg-primary"
    >
      <Primitive.Thumb className="block size-[1.3rem] translate-x-[0.2rem] rounded-full bg-on-surface-variant transition-transform duration-150 group-data-[state=checked]:translate-x-[1.45rem] group-data-[state=checked]:bg-on-primary motion-reduce:transition-none" />
    </Primitive.Root>
  )
}
