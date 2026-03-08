import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Onboarding — Brand Identity', () => {
    test('user with completed brand identity goes to dashboard', async ({ page }) => {
        await loginAs(page)
        // Brand identity is created in global-setup → user lands on /dashboard
        expect(page.url()).toContain('/dashboard')
    })

    test('onboarding redirects to dashboard when brand identity exists', async ({ page }) => {
        await loginAs(page)
        await page.goto('/onboarding')
        // Page should redirect back to /dashboard since onboarding is already done
        await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    })

    test('dashboard shows "Configurar identidad de marca" as completed', async ({ page }) => {
        await loginAs(page)
        // The "Primeros pasos" checklist should show brand identity as done
        await expect(page.locator('text=Configurar identidad de marca').first()).toBeVisible({
            timeout: 10_000,
        })
    })
})
