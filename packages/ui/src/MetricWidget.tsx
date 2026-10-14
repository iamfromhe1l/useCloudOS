import type { ReactNode } from 'react'

import { Icon, type IconName } from './Icon'
import { cn } from './lib/cn'
const tones = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
} as const
interface Props {
  icon?: IconName
  label: string
  value: ReactNode
  detail?: ReactNode
  progress?: number
  tone?: 'primary' | 'secondary' | 'tertiary'
}
export function MetricWidget({ icon, label, value, detail, progress, tone = 'primary' }: Props) {
  const normalized = progress === undefined ? undefined : Math.min(100, Math.max(0, progress))
  return (
    <div className={cn('min-w-0 rounded-shape-medium p-3.5', tones[tone])}>
      <div className="flex items-center gap-1.5 text-label-medium font-semibold">
        {icon && <Icon name={icon} className="size-4" />}
        {label}
      </div>
      <p className="mt-1.5 text-title-large font-semibold [overflow-wrap:anywhere] tabular-nums">
        {value}
      </p>
      {detail && <div className="mt-1 text-body-small [overflow-wrap:anywhere]">{detail}</div>}
      {normalized !== undefined && (
        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-current/15"
          role="progressbar"
          aria-label={label}
          aria-valuenow={normalized}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className="block h-full rounded-full bg-current"
            style={{ width: normalized + '%' }}
          />
        </div>
      )}
    </div>
  )
}
