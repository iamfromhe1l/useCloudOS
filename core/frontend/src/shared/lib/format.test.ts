import { describe, expect, it } from 'vitest'

import { formatBytes, formatDuration, formatPercentage, formatTimestamp } from './format'

describe('formatBytes', () => {
  it('formats binary units', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(5 * 1024 ** 3)).toBe('5.0 GB')
  })

  it('handles invalid values', () => {
    expect(formatBytes(-1)).toBe('Not available')
  })
})

describe('formatDuration', () => {
  it('formats days, hours, and minutes', () => {
    expect(formatDuration(93_780)).toBe('1d 2h 3m')
    expect(formatDuration(42)).toBe('42s')
  })
})

describe('formatTimestamp', () => {
  it('formats valid timestamps and rejects zero timestamps', () => {
    expect(formatTimestamp('2026-10-06T12:00:00Z')).not.toBe('Not available')
    expect(formatTimestamp('0001-01-01T00:00:00Z')).toBe('Not available')
  })
})

describe('formatPercentage', () => {
  it('uses one decimal place', () => {
    expect(formatPercentage(12.45)).toBe('12.5%')
  })
})
