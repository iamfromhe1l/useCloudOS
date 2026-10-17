import add from '@material-symbols/svg-400/rounded/add.svg'
import apps from '@material-symbols/svg-400/rounded/apps.svg'
import arrowBack from '@material-symbols/svg-400/rounded/arrow_back.svg'
import backup from '@material-symbols/svg-400/rounded/backup.svg'
import checkCircle from '@material-symbols/svg-400/rounded/check_circle.svg'
import chevronRight from '@material-symbols/svg-400/rounded/chevron_right.svg'
import close from '@material-symbols/svg-400/rounded/close.svg'
import cloud from '@material-symbols/svg-400/rounded/cloud.svg'
import deployedCode from '@material-symbols/svg-400/rounded/deployed_code.svg'
import dns from '@material-symbols/svg-400/rounded/dns.svg'
import error from '@material-symbols/svg-400/rounded/error.svg'
import folder from '@material-symbols/svg-400/rounded/folder.svg'
import gridView from '@material-symbols/svg-400/rounded/grid_view.svg'
import hardDrive from '@material-symbols/svg-400/rounded/hard_drive.svg'
import home from '@material-symbols/svg-400/rounded/home.svg'
import info from '@material-symbols/svg-400/rounded/info.svg'
import memory from '@material-symbols/svg-400/rounded/memory.svg'
import moreHoriz from '@material-symbols/svg-400/rounded/more_horiz.svg'
import networkWifi from '@material-symbols/svg-400/rounded/network_wifi.svg'
import notifications from '@material-symbols/svg-400/rounded/notifications.svg'
import palette from '@material-symbols/svg-400/rounded/palette.svg'
import playArrow from '@material-symbols/svg-400/rounded/play_arrow.svg'
import refresh from '@material-symbols/svg-400/rounded/refresh.svg'
import restartAlt from '@material-symbols/svg-400/rounded/restart_alt.svg'
import search from '@material-symbols/svg-400/rounded/search.svg'
import settings from '@material-symbols/svg-400/rounded/settings.svg'
import stop from '@material-symbols/svg-400/rounded/stop.svg'
import storage from '@material-symbols/svg-400/rounded/storage.svg'
import tune from '@material-symbols/svg-400/rounded/tune.svg'
import upload from '@material-symbols/svg-400/rounded/upload.svg'
import type { CSSProperties } from 'react'

import styles from './controls.module.css'
import { cn } from './lib/cn'

const icons = {
  moreHoriz,
  search,
  chevronRight,
  upload,
  add,
  arrowBack,
  apps,
  backup,
  checkCircle,
  close,
  cloud,
  deployedCode,
  dns,
  error,
  folder,
  gridView,
  hardDrive,
  home,
  info,
  memory,
  notifications,
  networkWifi,
  palette,
  playArrow,
  refresh,
  restartAlt,
  settings,
  stop,
  storage,
  tune,
} as const

export type IconName = keyof typeof icons
export function isIconName(value: string): value is IconName {
  return Object.hasOwn(icons, value)
}

interface IconProps {
  name: IconName
  className?: string
}

export function Icon({ name, className }: IconProps) {
  const style = {
    '--icon-url': `url("${icons[name]}")`,
  } as CSSProperties

  return <span aria-hidden="true" className={cn(styles['icon-mask'], className)} style={style} />
}
