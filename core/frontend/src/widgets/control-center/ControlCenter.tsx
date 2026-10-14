import * as Dialog from '@radix-ui/react-dialog'
import { lazy, Suspense } from 'react'

import { ControlCenterTrigger } from '@/features/control-center-toggle'
import { Icon } from '@/shared/ui'

import styles from './ControlCenter.module.css'
const ControlCenterContent = lazy(() =>
  import('./ControlCenterContent').then((module) => ({ default: module.ControlCenterContent })),
)
export function ControlCenter({ initialOpen = false }: { initialOpen?: boolean }) {
  return (
    <Dialog.Root defaultOpen={initialOpen}>
      <Dialog.Trigger asChild>
        <ControlCenterTrigger />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.panel}>
          <header className={styles.header}>
            <div>
              <Dialog.Title className={styles.title}>Control Center</Dialog.Title>
              <Dialog.Description className={styles.description}>
                Quick system status and controls
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close control center" className={styles.close}>
                <Icon name="close" className="size-5" />
              </button>
            </Dialog.Close>
          </header>
          <Suspense fallback={<p role="status">Loading controls…</p>}>
            <ControlCenterContent />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
