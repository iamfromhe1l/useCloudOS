import { Tooltip } from './Tooltip'
export function OverflowText({ text }: { text: string }) {
  return (
    <Tooltip label={text}>
      <button
        type="button"
        className="block w-full min-w-0 truncate border-0 bg-transparent p-0 [text-align:inherit] text-[inherit] [font:inherit]"
      >
        {text}
      </button>
    </Tooltip>
  )
}
