import './style.css'

import { registerReactApplication } from '@usecloud/app-sdk/react'

import { FilesApplication } from '@/app/FilesApplication'
registerReactApplication({
  element: 'usecloud-files-v0-2-0',
  Application: FilesApplication,
  styles:
    ':host{display:block;height:100%;min-width:0;color:var(--uc-on-surface);font-family:inherit}.usecloud-app-root{height:100%;min-height:0}*,*::before,*::after{box-sizing:border-box}',
})
