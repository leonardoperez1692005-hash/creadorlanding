export async function register() {
    // Only validate env and load Sentry in Node.js runtime, not in Edge (middleware)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { validateEnv } = await import('@/lib/env')
        validateEnv()

        if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
            await import('../sentry.server.config')
        }
    }
}
