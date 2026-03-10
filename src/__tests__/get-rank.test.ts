import { describe, it, expect } from 'vitest'
import { getRank } from '@/lib/get-rank'

describe('getRank', () => {
  const tiers = [
    { min: 90, label: 'S' },
    { min: 75, label: 'A' },
    { min: 60, label: 'B' },
    { min: 40, label: 'C' },
  ] as const

  it('returns the highest matching tier', () => {
    expect(getRank(95, tiers, 'D')).toBe('S')
    expect(getRank(90, tiers, 'D')).toBe('S')
  })

  it('returns mid-range tiers correctly', () => {
    expect(getRank(80, tiers, 'D')).toBe('A')
    expect(getRank(75, tiers, 'D')).toBe('A')
    expect(getRank(65, tiers, 'D')).toBe('B')
    expect(getRank(45, tiers, 'D')).toBe('C')
  })

  it('returns fallback when below all thresholds', () => {
    expect(getRank(30, tiers, 'D')).toBe('D')
    expect(getRank(0, tiers, 'D')).toBe('D')
    expect(getRank(-5, tiers, 'D')).toBe('D')
  })

  it('handles exact boundary values', () => {
    expect(getRank(40, tiers, 'D')).toBe('C')
    expect(getRank(39, tiers, 'D')).toBe('D')
  })

  it('handles empty tiers array', () => {
    expect(getRank(100, [], 'fallback')).toBe('fallback')
  })

  it('handles single tier', () => {
    const single = [{ min: 50, label: 'pass' }] as const
    expect(getRank(50, single, 'fail')).toBe('pass')
    expect(getRank(49, single, 'fail')).toBe('fail')
  })
})
