import { Tooltip } from './Tooltip'
export function OverflowText({ text }: { text: string }) {
  return (
    <Tooltip label={text}>
      <span
        title={text}
        className="block w-full min-w-0 cursor-default truncate [text-align:inherit] text-[inherit] [font:inherit]"
      >
        {text}
      </span>
    </Tooltip>
  )
}
