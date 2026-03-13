// =============================================
// Centralized Environment Variable Access
// =============================================
// All env vars accessed through lazy getters — validated on first use, not at import time.

function requireEnv(name: string): string {
    const val = process.env[name]
    if (!val) throw new Error(`Missing required env var: ${name}`)
    return val
}

/**
 * Eagerly validate all required env vars at startup.
 * Call this from instrumentation.ts or app entry point.
 */
export function validateEnv(): void {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
    ]
    const missing = required.filter((name) => !process.env[name])
    if (missing.length > 0) {
        throw new Error(
            `[ENV] Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
                'Copy .env.local.example to .env.local and fill in the values.',
        )
    }
}

export const env = {
    get supabaseUrl(): string {
        return requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    },
    get supabaseAnonKey(): string {
        return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    },
    get supabaseServiceKey(): string {
        return requireEnv('SUPABASE_SERVICE_ROLE_KEY')
    },
    get geminiApiKey(): string {
        const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
        if (!key) throw new Error('Missing env var: GEMINI_API_KEY or GOOGLE_AI_API_KEY')
        return key
    },
    /** AI provider: 'gemini' (default) or 'claude' */
    get aiProvider(): string {
        return (process.env.AI_PROVIDER ?? 'gemini').toLowerCase()
    },
    get claudeApiKey(): string {
        const key = process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY
        if (!key) throw new Error('Missing env var: CLAUDE_API_KEY or ANTHROPIC_API_KEY')
        return key
    },
    get brightdataApiKey(): string {
        return process.env.BRIGHTDATA_API_KEY ?? ''
    },
    get brightdataZone(): string {
        return process.env.BRIGHTDATA_ZONE ?? 'brandvortix_scraper'
    },
    /** OpenAI API key for Whisper transcription (optional — falls back to YouTube captions) */
    get openaiApiKey(): string {
        return process.env.OPENAI_API_KEY ?? ''
    },
    /** Railway video worker URL — required in production to run yt-dlp (Vercel has no Python) */
    get videoWorkerUrl(): string {
        return process.env.VIDEO_WORKER_URL ?? ''
    },
    /** Bearer token to authenticate requests to the video worker */
    get videoWorkerToken(): string {
        return process.env.VIDEO_WORKER_TOKEN ?? ''
    },
}
