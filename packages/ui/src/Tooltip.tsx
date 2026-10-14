import * as Primitive from '@radix-ui/react-tooltip'
import type { ReactElement } from 'react'

import { usePortalContainer } from './PortalProvider'
export function Tooltip({ label, children }: { label: string; children: ReactElement }) {
  const container = usePortalContainer()
  return (
    <Primitive.Provider delayDuration={400}>
      <Primitive.Root>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>
        <Primitive.Portal container={container}>
          <Primitive.Content
            sideOffset={8}
            className="z-100 max-w-[min(28rem,90vw)] rounded-shape-small bg-inverse-surface px-3 py-2 text-body-small [overflow-wrap:anywhere] text-inverse-on-surface"
          >
            {label}
            <Primitive.Arrow className="fill-inverse-surface" />
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  )
}
