import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

/** Unique suffix for non-auth test data (leads, projects) */
export const RUN_ID = Date.now().toString(36)

/** Test user credentials — fixed email, created by global-setup.ts via admin API */
export const TEST_USER = {
    name: 'E2E Tester',
    email: 'e2e-test@staticlaunch.test',
    password: 'E2eTestPass123!',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0]
const COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`
const MAX_CHUNK_SIZE = 3180

/**
 * Login the test user by signing in via Supabase API and injecting
 * auth cookies into the browser context (bypasses server action redirect issues).
 */
export async function loginAs(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
    // 1. Sign in via Supabase JS client from Node.js
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(`loginAs failed: ${error.message}`)

    // 2. Encode session in @supabase/ssr format: "base64-" + base64url(JSON)
    const sessionJson = JSON.stringify(data.session)
    const encoded = 'base64-' + Buffer.from(sessionJson, 'utf-8').toString('base64url')

    // 3. Chunk if needed and set cookies via Playwright
    const cookieBase = { domain: 'localhost', path: '/', sameSite: 'Lax' as const }

    if (encoded.length <= MAX_CHUNK_SIZE) {
        await page.context().addCookies([{ ...cookieBase, name: COOKIE_NAME, value: encoded }])
    } else {
        const cookies = []
        for (let i = 0; i * MAX_CHUNK_SIZE < encoded.length; i++) {
            cookies.push({
                ...cookieBase,
                name: `${COOKIE_NAME}.${i}`,
                value: encoded.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE),
            })
        }
        await page.context().addCookies(cookies)
    }

    // 4. Navigate — middleware sees auth cookies → allows through
    await page.goto('/')
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15_000 })
}
