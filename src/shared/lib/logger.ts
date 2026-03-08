/**
 * Centralized structured logger.
 * - Development: pretty console output with prefixes
 * - Production: JSON lines for log aggregation (Vercel Logs, Datadog, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogPayload {
    message: string
    feature?: string
    action?: string
    userId?: string
    metadata?: Record<string, unknown>
    error?: unknown
}

const IS_PROD = process.env.NODE_ENV === 'production'

function formatError(err: unknown): Record<string, unknown> | undefined {
    if (!err) return undefined
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message,
            ...(IS_PROD ? {} : { stack: err.stack }),
        }
    }
    return { raw: String(err) }
}

function reportToSentry(level: LogLevel, payload: LogPayload) {
    if (!IS_PROD) return
    try {
        import('@sentry/nextjs').then((Sentry) => {
            if (!Sentry.getClient()) return
            if (level === 'error' && payload.error) {
                Sentry.captureException(payload.error, {
                    tags: { feature: payload.feature, action: payload.action },
                    extra: payload.metadata,
                })
            } else if (level === 'error' || level === 'warn') {
                Sentry.captureMessage(payload.message, {
                    level: level === 'error' ? 'error' : 'warning',
                    tags: { feature: payload.feature, action: payload.action },
                    extra: payload.metadata,
                })
            }
        })
    } catch {
        // Sentry not available — silent fallback
    }
}

function log(level: LogLevel, payload: LogPayload) {
    const errObj = payload.error ? formatError(payload.error) : undefined
    const entry: Record<string, unknown> = {
        level,
        ts: new Date().toISOString(),
        msg: payload.message,
    }
    if (payload.feature) entry.feature = payload.feature
    if (payload.action) entry.action = payload.action
    if (payload.userId) entry.userId = payload.userId
    if (payload.metadata) entry.meta = payload.metadata
    if (errObj) entry.error = errObj

    if (IS_PROD) {
        const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
        fn(JSON.stringify(entry))
        reportToSentry(level, payload)
    } else {
        const prefix = `[${payload.feature || 'app'}]`
        const fn =
            level === 'error'
                ? console.error
                : level === 'warn'
                  ? console.warn
                  : level === 'debug'
                    ? console.debug
                    : console.log
        if (payload.error) {
            fn(prefix, payload.message, payload.metadata || '', payload.error)
        } else {
            fn(prefix, payload.message, payload.metadata || '')
        }
    }
}

export const logger = {
    debug: (feature: string, message: string, metadata?: Record<string, unknown>) =>
        !IS_PROD && log('debug', { feature, message, metadata }),
    info: (feature: string, message: string, metadata?: Record<string, unknown>) =>
        log('info', { feature, message, metadata }),
    warn: (feature: string, message: string, metadata?: Record<string, unknown>) =>
        log('warn', { feature, message, metadata }),
    error: (
        feature: string,
        message: string,
        error?: unknown,
        metadata?: Record<string, unknown>,
    ) => log('error', { feature, message, error, metadata }),
}
