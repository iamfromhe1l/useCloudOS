import { Popover, PopoverContent } from '@usecloud/ui/overlays'
import { type ReactNode, useEffect, useState } from 'react'

import { useSystemResources } from '@/entities/system'
import { formatBytes, formatPercentage } from '@/shared/lib'
import { MetricWidget } from '@/shared/ui'

import styles from './SystemBar.module.css'
export function ResourcePopover({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(true), [])
  const query = useSystemResources()
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className={styles.metrics} aria-label="System resources">
          {children}
        </button>
      </Popover.Trigger>
      <PopoverContent aria-label="System resources" align="end" className="w-80">
        <h2 className="mb-3 text-title-medium font-semibold">System resources</h2>
        {query.data ? (
          <div className="grid grid-cols-2 gap-2">
            <MetricWidget
              label="CPU"
              value={formatPercentage(query.data.cpu.usage_percent)}
              progress={query.data.cpu.usage_percent}
            />
            <MetricWidget
              tone="secondary"
              label="Memory"
              value={formatBytes(query.data.memory.used_bytes)}
              progress={query.data.memory.usage_percent}
            />
          </div>
        ) : (
          <p>Resources unavailable</p>
        )}
      </PopoverContent>
    </Popover.Root>
  )
}
