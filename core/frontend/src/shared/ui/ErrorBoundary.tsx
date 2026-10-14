import { ErrorState } from '@usecloud/ui'
import { Component, type PropsWithChildren, type ReactNode } from 'react'
export class ShellErrorBoundary extends Component<PropsWithChildren, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render(): ReactNode {
    return this.state.failed ? (
      <ErrorState message="Shell failed to render. Reload to recover." />
    ) : (
      this.props.children
    )
  }
}
