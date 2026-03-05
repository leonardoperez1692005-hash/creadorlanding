// =============================================
// Centralized Environment Variable Access
// =============================================
// All env vars accessed through lazy getters — validated on first use, not at import time.

function requireEnv(name: string): string {
    const val = process.env[name]
    if (!val) throw new Error(`Missing required env var: ${name}`)
    return val
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
    get brightdataApiKey(): string {
        return process.env.BRIGHTDATA_API_KEY ?? ''
    },
    get brightdataZone(): string {
        return process.env.BRIGHTDATA_ZONE ?? 'static_launch_scraper'
    },
}
