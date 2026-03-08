export async function register() {
    const { validateEnv } = await import('@/lib/env')
    validateEnv()

    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        await import('../sentry.server.config')
    }
}
