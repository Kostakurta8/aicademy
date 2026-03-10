/**
 * In-memory sliding-window rate limiter.
 * Each IP gets a fixed number of requests per time window.
 * Stale entries are lazily cleaned up to prevent unbounded growth.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 60_000 // clean every 60s

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const cutoff = now - windowMs
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetMs: number
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanup(windowMs)

  const now = Date.now()
  const cutoff = now - windowMs
  const entry = store.get(key) || { timestamps: [] }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldest + windowMs - now,
    }
  }

  entry.timestamps.push(now)
  store.set(key, entry)

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  }
}
