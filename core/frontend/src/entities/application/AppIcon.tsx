import { cn, Icon } from '@/shared/ui'

import styles from './AppIcon.module.css'
import type { Application } from './registry'
export function AppIcon({
  application,
  className,
}: {
  application: Application
  className?: string
}) {
  return (
    <span className={cn(styles.icon, styles[application.colorRole], className)}>
      {application.iconURL ? (
        <img src={application.iconURL} alt="" className="size-6 object-contain" loading="lazy" />
      ) : (
        <Icon name={application.icon} className="size-6" />
      )}
    </span>
  )
}
