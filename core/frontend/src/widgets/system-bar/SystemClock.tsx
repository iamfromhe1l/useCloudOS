import { useEffect, useState } from 'react'

import styles from './SystemBar.module.css'
export function SystemClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <time className={styles.clock} dateTime={time.toISOString()}>
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </time>
  )
}
