import { test, expect } from '@playwright/test'
import { TEST_USER, loginAs, RUN_ID } from './helpers'

test.describe('Wizard — Project creation', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page)
        // Brand identity is created in global-setup → user goes to /dashboard
        if (!page.url().includes('/dashboard')) {
            await page.goto('/dashboard')
        }
        await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
    })

    test('dashboard shows link to create new landing', async ({ page }) => {
        // "Nueva Landing Page" link should exist on dashboard
        const newLandingLink = page.locator('a[href="/wizard"]').first()
        await expect(newLandingLink).toBeVisible({ timeout: 10_000 })
    })

    test('wizard step 1: shows project config form', async ({ page }) => {
        await page.goto('/wizard')
        // Should show the step type selection
        await expect(page.locator('text=Configura tu Estrategia').first()).toBeVisible({
            timeout: 10_000,
        })
        // Project name input
        await expect(page.locator('input[placeholder*="Lanzamiento"]')).toBeVisible()
        // Visual mode buttons
        await expect(page.locator('text=Oscuro').first()).toBeVisible()
        await expect(page.locator('text=Claro').first()).toBeVisible()
    })

    test('wizard step 1: "Comenzar" is disabled without project name', async ({ page }) => {
        await page.goto('/wizard')
        await page.waitForTimeout(1500)
        // Clear the project name field
        const nameInput = page.locator('input[placeholder*="Lanzamiento"]')
        await nameInput.fill('')
        // Comenzar button should be disabled (opacity 0.3)
        const beginBtn = page.locator('button:has-text("Comenzar")')
        await expect(beginBtn).toBeVisible()
        // The button has disabled-like styling when no name
        const opacity = await beginBtn.evaluate((el) => getComputedStyle(el).opacity)
        expect(Number(opacity)).toBeLessThan(0.5)
    })

    test('wizard full flow: create project and enter editor', async ({ page }) => {
        await page.goto('/wizard')
        await page.waitForTimeout(1500)

        // 1. Fill project name
        const nameInput = page.locator('input[placeholder*="Lanzamiento"]')
        await nameInput.fill(`E2E Test ${RUN_ID}`)

        // 2. Select dark mode (should be default, click to be sure)
        await page.locator('text=Oscuro').first().click()

        // 3. First structure type card is VSL (selected by default)
        // Just verify it's visible and click Comenzar
        const beginBtn = page.locator('button:has-text("Comenzar")')
        await expect(beginBtn).toBeEnabled()
        await beginBtn.click()

        // 4. Should enter the wizard editor (step index > 0)
        // The editor has a different layout — check for the header with save/publish buttons
        await expect(page.locator('button:has-text("Guardar")').first()).toBeVisible({
            timeout: 10_000,
        })
        await expect(page.locator('button:has-text("Publicar")').first()).toBeVisible()
    })

    test('wizard editor: save project', async ({ page }) => {
        await page.goto('/wizard')
        await page.waitForTimeout(1500)

        // Create a new project
        await page.locator('input[placeholder*="Lanzamiento"]').fill(`Save Test ${RUN_ID}`)
        await page.locator('button:has-text("Comenzar")').click()

        // Wait for editor
        const saveBtn = page.locator('button:has-text("Guardar")').first()
        await expect(saveBtn).toBeVisible({ timeout: 10_000 })

        // Click save
        await saveBtn.click()

        // After save, the button should briefly show "Guardado"
        await expect(page.locator('text=Guardado').first()).toBeVisible({ timeout: 10_000 })
    })

    test('wizard editor: publish project opens new tab', async ({ page, context }) => {
        await page.goto('/wizard')
        await page.waitForTimeout(1500)

        // Create project
        await page.locator('input[placeholder*="Lanzamiento"]').fill(`Publish Test ${RUN_ID}`)
        await page.locator('button:has-text("Comenzar")').click()

        // Wait for editor
        const publishBtn = page.locator('button:has-text("Publicar")').first()
        await expect(publishBtn).toBeVisible({ timeout: 10_000 })

        // Listen for new tab
        const pagePromise = context.waitForEvent('page', { timeout: 15_000 })
        await publishBtn.click()

        // New tab should open with /p/ URL
        const newPage = await pagePromise
        await newPage.waitForLoadState()
        expect(newPage.url()).toContain('/p/')

        // The landing page should contain HTML content
        const html = await newPage.content()
        expect(html).toContain('<!DOCTYPE html>')
    })
})
