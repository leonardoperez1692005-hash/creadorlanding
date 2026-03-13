/**
 * Rate limiter with Upstash Redis support + in-memory fallback.
 *
 * To enable Redis (recommended for production/Vercel):
 *   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=AXxx...
 *
 * Without these env vars, falls back to in-memory (works for single-instance).
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitConfig {
    limit: number
    windowSec: number
}

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number
}

// --- Upstash Redis limiter (persistent, cross-instance) ---
let redisLimiterCache: Map<string, Ratelimit> | null = null

function getUpstashLimiter(windowSec: number, limit: number): Ratelimit | null {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) return null

    if (!redisLimiterCache) redisLimiterCache = new Map()
    const cacheKey = `${windowSec}:${limit}`
    let limiter = redisLimiterCache.get(cacheKey)
    if (!limiter) {
        const redis = new Redis({ url, token })
        limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.fixedWindow(limit, `${windowSec} s`),
            prefix: 'sl-rl',
        })
        redisLimiterCache.set(cacheKey, limiter)
    }
    return limiter
}

// --- In-memory fallback ---
interface MemEntry {
    count: number
    resetAt: number
}
const memStore = new Map<string, MemEntry>()

if (typeof setInterval !== 'undefined') {
    setInterval(
        () => {
            const now = Date.now()
            for (const [k, v] of memStore) {
                if (v.resetAt < now) memStore.delete(k)
            }
        },
        5 * 60 * 1000,
    ).unref?.()
}

function memRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowMs = config.windowSec * 1000
    const entry = memStore.get(key)

    if (!entry || entry.resetAt < now) {
        const resetAt = now + windowMs
        memStore.set(key, { count: 1, resetAt })
        return { allowed: true, remaining: config.limit - 1, resetAt }
    }

    entry.count++
    if (entry.count > config.limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

// --- Public API ---

/** Evalúa rate limit de forma async (Upstash Redis si disponible, sino fallback en memoria). */
export async function rateLimitAsync(
    key: string,
    config: RateLimitConfig,
): Promise<RateLimitResult> {
    const upstash = getUpstashLimiter(config.windowSec, config.limit)
    if (upstash) {
        const result = await upstash.limit(key)
        return {
            allowed: result.success,
            remaining: result.remaining,
            resetAt: result.reset,
        }
    }
    return memRateLimit(key, config)
}

/** Evalúa rate limit de forma síncrona (solo en memoria, para server actions). */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    return memRateLimit(key, config)
}
