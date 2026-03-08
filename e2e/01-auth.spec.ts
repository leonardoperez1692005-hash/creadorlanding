import { test, expect } from '@playwright/test'
import { TEST_USER, loginAs } from './helpers'

test.describe('Auth — Register page', () => {
    test('shows register form with all fields', async ({ page }) => {
        await page.goto('/register')
        await expect(page.locator('input[name="name"]')).toBeVisible()
        await expect(page.locator('input[name="email"]')).toBeVisible()
        await expect(page.locator('input[name="password"]')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toContainText('Crear mi cuenta gratis')
    })

    test('has link to login page', async ({ page }) => {
        await page.goto('/register')
        const loginLink = page.locator('a[href="/login"]')
        await expect(loginLink).toBeVisible()
        await expect(loginLink).toContainText('Inicia sesión')
    })
})

test.describe('Auth — Login page', () => {
    test('shows login form with all fields', async ({ page }) => {
        await page.goto('/login')
        await expect(page.locator('input[name="email"]')).toBeVisible()
        await expect(page.locator('input[name="password"]')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toContainText('Ingresar al Sistema')
    })

    test('shows error on invalid credentials', async ({ page }) => {
        await page.goto('/login')
        await page.locator('input[name="email"]').fill('nonexistent@test.local')
        await page.locator('input[name="password"]').fill('wrongpassword123')
        await page.locator('button[type="submit"]').click()
        const errorDiv = page.locator('text=Email o contraseña incorrectos')
        await expect(errorDiv).toBeVisible({ timeout: 10_000 })
    })

    test('logs in with valid credentials and redirects', async ({ page }) => {
        await loginAs(page)
        // Should be on onboarding (first time) or dashboard
        expect(page.url()).toMatch(/\/(onboarding|dashboard)/)
    })

    test('has link to register page', async ({ page }) => {
        await page.goto('/login')
        const registerLink = page.locator('a[href="/register"]')
        await expect(registerLink).toBeVisible()
    })
})

test.describe('Auth — Protected routes', () => {
    test('redirects unauthenticated user from /dashboard to /login', async ({ page }) => {
        await page.goto('/dashboard')
        await page.waitForURL(/\/login/, { timeout: 10_000 })
    })

    test('redirects unauthenticated user from /wizard to /login', async ({ page }) => {
        await page.goto('/wizard')
        await page.waitForURL(/\/login/, { timeout: 10_000 })
    })

    test('redirects unauthenticated user from /admin to /login', async ({ page }) => {
        await page.goto('/admin')
        await page.waitForURL(/\/login/, { timeout: 10_000 })
    })
})
