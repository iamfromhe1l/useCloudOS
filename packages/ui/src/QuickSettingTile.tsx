import { Icon, type IconName } from './Icon'
import { cn } from './lib/cn'
interface Props {
  icon: IconName
  label: string
  detail?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}
export function QuickSettingTile({ icon, label, detail, active, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-18 min-w-0 items-center gap-3 rounded-shape-large p-3.5 text-left enabled:cursor-pointer enabled:hover:outline enabled:hover:outline-primary',
        active
          ? 'bg-primary-container text-on-primary-container'
          : 'bg-secondary-container text-on-secondary-container',
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} className="size-6" />
      <span className="min-w-0">
        <strong className="block text-label-large">{label}</strong>
        {detail && (
          <small className="block text-body-small [overflow-wrap:anywhere]">{detail}</small>
        )}
      </span>
    </button>
  )
}
