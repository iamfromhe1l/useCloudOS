import {Component,type PropsWithChildren,type ReactNode} from 'react'

import {ErrorState} from '@/shared/ui'
export class AppHostErrorBoundary extends Component<PropsWithChildren,{failed:boolean}>{
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render():ReactNode{return this.state.failed?<ErrorState message="Application failed to render. Return to the desktop to recover."/>:this.props.children}
}
