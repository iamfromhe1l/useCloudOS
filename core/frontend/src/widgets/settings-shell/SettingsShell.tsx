import * as Tabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AppWindow } from '@/entities/application'
import { useMediaQuery } from '@/shared/lib'
import { Icon, type IconName } from '@/shared/ui'

import styles from './SettingsShell.module.css'
const destinations: { id: string; label: string; icon: IconName }[] = [
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'network', label: 'Network', icon: 'networkWifi' },
  { id: 'storage', label: 'Storage', icon: 'hardDrive' },
  { id: 'apps', label: 'Apps', icon: 'apps' },
  { id: 'users', label: 'Users', icon: 'checkCircle' },
  { id: 'accessibility', label: 'Accessibility', icon: 'tune' },
  { id: 'system', label: 'System', icon: 'dns' },
  { id: 'about', label: 'About', icon: 'info' },
]
export function SettingsShell({ sections }: { sections: Record<string, ReactNode> }) {
  const compact = useMediaQuery('(max-width:599px)')
  const [params, setParams] = useSearchParams()
  const selected = destinations.some((item) => item.id === params.get('section'))
    ? params.get('section')!
    : 'appearance'
  return (
    <AppWindow appId="settings">
      <Tabs.Root
        value={selected}
        onValueChange={(section) => setParams({ section })}
        className={styles.layout}
        orientation={compact ? 'horizontal' : 'vertical'}
      >
        <Tabs.List aria-label="Settings sections" className={styles.navigation}>
          {destinations.map((item) => (
            <Tabs.Trigger key={item.id} value={item.id} className={styles.navItem}>
              <Icon name={item.icon} className="size-5" />
              <span>{item.label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className={styles.content}>
          {destinations.map((item) => (
            <Tabs.Content value={item.id} key={item.id} className={styles.pane}>
              {sections[item.id]}
            </Tabs.Content>
          ))}
        </div>
      </Tabs.Root>
    </AppWindow>
  )
}
