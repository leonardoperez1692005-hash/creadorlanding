import { test, expect } from '@playwright/test'

test.describe('Public Landing — /p/[slug]', () => {
    test('returns 404 for non-existent slug', async ({ request }) => {
        const response = await request.get('/p/nonexistent-slug-12345')
        expect(response.status()).toBe(404)
        const html = await response.text()
        expect(html.toLowerCase()).toContain('no encontrad')
    })

    test('serves 404 as HTML (not redirect)', async ({ request }) => {
        const response = await request.get('/p/nonexistent-slug-12345')
        expect(response.status()).toBe(404)
        expect(response.headers()['content-type']).toContain('text/html')
    })

    test('does not redirect to /login (public route)', async ({ page }) => {
        // Navigate to a non-existent landing — should stay on /p/ (404), not redirect to /login
        const response = await page.goto('/p/some-test-slug')
        // Should get a 404 response, not a redirect
        expect(response?.status()).toBe(404)
    })

    test('does not include CSP header on landing pages', async ({ request }) => {
        const response = await request.get('/p/any-slug')
        const csp = response.headers()['content-security-policy']
        expect(csp).toBeFalsy()
    })

    test('includes security headers on landing pages', async ({ request }) => {
        const response = await request.get('/p/any-slug')
        expect(response.headers()['x-content-type-options']).toBe('nosniff')
    })
})
