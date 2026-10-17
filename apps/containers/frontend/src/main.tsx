import './style.css'

import { registerReactApplication } from '@usecloud/app-sdk/react'

import { ContainersApplication } from './app/ContainersApplication'
registerReactApplication({
  element: 'usecloud-containers-v0-2-0',
  Application: ContainersApplication,
  styles: '',
})
