import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

// The module uses a module-level Map, so we need to isolate between test groups
// by using unique keys per test

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const result = checkRateLimit('test-allow-1', 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('blocks requests at the limit', () => {
    const key = 'test-block-1'
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000)
    }
    const result = checkRateLimit(key, 3, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.resetMs).toBeGreaterThan(0)
  })

  it('tracks remaining count correctly', () => {
    const key = 'test-remaining-1'
    const r1 = checkRateLimit(key, 5, 60_000)
    expect(r1.remaining).toBe(4)
    const r2 = checkRateLimit(key, 5, 60_000)
    expect(r2.remaining).toBe(3)
    const r3 = checkRateLimit(key, 5, 60_000)
    expect(r3.remaining).toBe(2)
  })

  it('allows requests after window expires', () => {
    const key = 'test-expire-1'
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    for (let i = 0; i < 2; i++) {
      checkRateLimit(key, 2, 1_000)
    }
    const blocked = checkRateLimit(key, 2, 1_000)
    expect(blocked.allowed).toBe(false)

    // Advance time past the window
    vi.spyOn(Date, 'now').mockReturnValue(now + 1_001)
    const allowed = checkRateLimit(key, 2, 1_000)
    expect(allowed.allowed).toBe(true)

    vi.restoreAllMocks()
  })

  it('isolates keys from each other', () => {
    const r1 = checkRateLimit('user-a', 1, 60_000)
    expect(r1.allowed).toBe(true)

    const r2 = checkRateLimit('user-b', 1, 60_000)
    expect(r2.allowed).toBe(true)
  })
})
