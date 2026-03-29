/**
 * Simple in-memory rate limiter based on sliding window.
 * Suitable for single-server deployments.
 * For multi-server setups, replace with Redis-backed implementation.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name)
  if (!store) {
    store = new Map()
    stores.set(name, store)
  }
  return store
}

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 15 * 60 * 1000)
      if (entry.timestamps.length === 0) store.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS).unref()

export interface RateLimitConfig {
  /** Unique name for this limiter (e.g. "login", "signup") */
  name: string
  /** Maximum number of requests allowed within the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Seconds until the client can retry */
  retryAfterSeconds: number
}

/**
 * Check if a request from `key` (usually IP) is within rate limits.
 */
export function checkRateLimit(config: RateLimitConfig, key: string): RateLimitResult {
  const store = getStore(config.name)
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = windowMs - (now - oldestInWindow)
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    }
  }

  entry.timestamps.push(now)
  return { allowed: true, retryAfterSeconds: 0 }
}

/**
 * Extract client IP from request headers (works behind proxies).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}

/**
 * Build a standard 429 response.
 */
export function rateLimitResponse(retryAfterSeconds: number): Response {
  return Response.json(
    { ok: false, error: "Trop de tentatives. Veuillez réessayer plus tard." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  )
}
