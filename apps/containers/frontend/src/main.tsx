import './style.css'

import { registerReactApplication } from '@usecloud/app-sdk/react'

import { ContainersApplication } from './app/ContainersApplication'
registerReactApplication({
  element: 'usecloud-containers-v0-1-0',
  Application: ContainersApplication,
  styles: '',
})
