import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Admin — Access control', () => {
    test('regular user is redirected from /admin to /dashboard', async ({ page }) => {
        await loginAs(page)
        // Brand identity is created in global-setup → user goes to /dashboard
        expect(page.url()).toContain('/dashboard')

        // Now try to access admin panel
        await page.goto('/admin')
        // Regular user should be redirected to /dashboard (not superadmin)
        await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    })

    test('unauthenticated user is redirected from /admin to /login', async ({ page }) => {
        await page.goto('/admin')
        await page.waitForURL(/\/login/, { timeout: 10_000 })
    })
})

test.describe('Security headers', () => {
    test('login page includes CSP header', async ({ request }) => {
        const response = await request.get('/login')
        const csp = response.headers()['content-security-policy']
        expect(csp).toBeTruthy()
        expect(csp).toContain('nonce-')
        expect(csp).toContain('strict-dynamic')
    })

    test('login page includes security headers', async ({ request }) => {
        const response = await request.get('/login')
        expect(response.headers()['x-content-type-options']).toBe('nosniff')
        expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN')
    })

    test('landing pages include relaxed CSP (no strict-dynamic)', async ({ request }) => {
        const response = await request.get('/p/test-slug')
        const csp = response.headers()['content-security-policy']
        expect(csp).toBeTruthy()
        expect(csp).toContain("'unsafe-inline'")
        expect(csp).not.toContain('strict-dynamic')
    })
})
