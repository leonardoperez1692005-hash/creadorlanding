import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load .env.local for Supabase keys (global-setup needs them)
dotenv.config({ path: '.env.local' })

const PORT = Number(process.env.E2E_PORT) || 3010

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false, // run sequentially — tests share auth state
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [['html', { open: 'never' }], ['list']],
    timeout: 30_000,
    globalSetup: './e2e/global-setup.ts',
    globalTeardown: './e2e/global-teardown.ts',

    use: {
        baseURL: process.env.E2E_BASE_URL || `http://localhost:${PORT}`,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Build and start production server */
    webServer: {
        command: `npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: true,
        timeout: 30_000,
    },
})
