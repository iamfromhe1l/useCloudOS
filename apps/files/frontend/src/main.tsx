import './style.css'

import { registerReactApplication } from '@usecloud/app-sdk/react'

import { FilesApplication } from '@/app/FilesApplication'
registerReactApplication({
  element: 'usecloud-files-v0-1-0',
  Application: FilesApplication,
  styles:
    ':host{display:block;min-width:0;color:var(--uc-on-surface);font-family:inherit}*,*::before,*::after{box-sizing:border-box}',
})
