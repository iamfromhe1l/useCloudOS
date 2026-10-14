export function containerStatusTone(state: string) {
  if (state === 'running') return 'success'
  if (state === 'paused' || state === 'restarting') return 'warning'
  if (state === 'dead') return 'error'
  return 'neutral'
}
