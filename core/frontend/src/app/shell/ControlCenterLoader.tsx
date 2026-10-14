import { lazy, Suspense, useState } from 'react'

import { ControlCenterTrigger } from '@/features/control-center-toggle'
const ControlCenter = lazy(() =>
  import('@/widgets/control-center').then((module) => ({ default: module.ControlCenter })),
)
export function ControlCenterLoader() {
  const [requested, setRequested] = useState(false)
  if (!requested)
    return <ControlCenterTrigger aria-expanded={false} onClick={() => setRequested(true)} />
  return (
    <Suspense fallback={<ControlCenterTrigger aria-busy="true" disabled />}>
      <ControlCenter initialOpen />
    </Suspense>
  )
}
