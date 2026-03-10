import { test, expect } from '@playwright/test'
import { loginAs, RUN_ID } from './helpers'

// ─── Export API Endpoints ─────────────────────────────
// Tests auth, validation, content-type, and basic generation
// Uses page.context().request to share auth cookies with API calls

const leadsPayload = {
    type: 'leads',
    data: {
        leads: [
            {
                id: '1',
                name: `Lead ${RUN_ID}`,
                email: 'test@test.com',
                phone: '+54 11 1234-5678',
                source: 'landing',
                message: 'Test',
                created_at: '2026-03-01T10:00:00Z',
            },
        ],
        projectName: `E2E Export ${RUN_ID}`,
    },
}

const strategyPayload = {
    type: 'strategy',
    data: {
        strategy: {
            salesAngles: [
                {
                    name: 'Test Angle',
                    type: 'emotion',
                    hook: 'Test hook',
                    description: 'Test desc',
                    adVariants: [{ headline: 'Ad 1', body: 'Body 1' }],
                },
            ],
            landingBlueprint: {
                recommendedType: 'VSL',
                sections: [{ name: 'Hero', purpose: 'Test', suggestedContent: 'Test' }],
            },
            competitorAnalysis: [
                {
                    name: 'Comp A',
                    mainMessage: 'Test',
                    strengths: ['S1'],
                    weaknesses: ['W1'],
                },
            ],
            marketInsights: {
                trends: ['T1'],
                painPoints: ['P1'],
                opportunities: ['O1'],
            },
            adsStrategy: { platforms: ['Facebook'], hooks: ['Hook'] },
            contentPillars: [{ pillar: 'P1', topics: ['T1'], tone: 'Pro' }],
        },
        meta: {
            competitorsScraped: 1,
            totalCompetitors: 1,
            hasMarketResearch: true,
            generatedAt: '2026-03-01T10:00:00Z',
        },
    },
}

// ─── Auth guard (middleware redirects unauthenticated to /login) ───

test.describe('Export API — Auth Guard', () => {
    for (const endpoint of ['pdf', 'xlsx', 'pptx', 'docx']) {
        test(`/api/exports/${endpoint} blocks unauthenticated requests`, async ({ request }) => {
            const res = await request.post(`/api/exports/${endpoint}`, {
                data: leadsPayload,
            })
            // Middleware redirects to /login (302/307) or returns login HTML (200)
            // Either way, it's NOT a valid export response
            const ct = res.headers()['content-type'] || ''
            expect(ct).not.toContain('application/pdf')
            expect(ct).not.toContain('spreadsheetml')
            expect(ct).not.toContain('presentationml')
            expect(ct).not.toContain('wordprocessingml')
        })
    }
})

// ─── PDF ──────────────────────────────────────────────

test.describe('PDF Export API', () => {
    test('rejects invalid type with 400', async ({ page }) => {
        await loginAs(page)
        const res = await page.context().request.post('/api/exports/pdf', {
            data: { type: 'invalid-type', data: {} },
        })
        expect(res.status()).toBe(400)
        const body = await res.json()
        expect(body.error).toContain('no soportado')
    })

    test('generates leads PDF with correct content-type', async ({ page }) => {
        await loginAs(page)
        const res = await page.context().request.post('/api/exports/pdf', {
            data: leadsPayload,
        })
        expect(res.status()).toBe(200)
        expect(res.headers()['content-type']).toBe('application/pdf')
        expect(res.headers()['content-disposition']).toContain('.pdf')
        const body = await res.body()
        expect(body.length).toBeGreaterThan(100)
        // PDF magic bytes
        expect(body.toString('ascii', 0, 4)).toBe('%PDF')
    })

    test('generates strategy PDF', async ({ page }) => {
        await loginAs(page)
        const res = await page.context().request.post('/api/exports/pdf', {
            data: strategyPayload,
        })
        expect(res.status()).toBe(200)
        expect(res.headers()['content-type']).toBe('application/pdf')
        const body = await res.body()
        expect(body.length).toBeGreaterThan(100)
    })
})

// ─── XLSX ─────────────────────────────────────────────

test.describe('XLSX Export API', () => {
    test('generates leads XLSX with correct content-type', async ({ page }) => {
        await loginAs(page)
        const res = await page.context().request.post('/api/exports/xlsx', {
            data: leadsPayload,
        })
        expect(res.status()).toBe(200)
        expect(res.headers()['content-type']).toContain('spreadsheetml.sheet')
        expect(res.headers()['content-disposition']).toContain('.xlsx')
        const body = await res.body()
        expect(body.length).toBeGreaterThan(100)
        // ZIP/XLSX magic bytes
        expect(body.toString('ascii', 0, 2)).toBe('PK')
    })
})

// ─── PPTX ─────────────────────────────────────────────

test.describe('PPTX Export API', () => {
    test('generates strategy PPTX with correct content-type', async ({ page }) => {
        await loginAs(page)
        const res = await page.context().request.post('/api/exports/pptx', {
            data: strategyPayload,
        })
        expect(res.status()).toBe(200)
        expect(res.headers()['content-type']).toContain('presentationml.presentation')
        expect(res.headers()['content-disposition']).toContain('.pptx')
        const body = await res.body()
        expect(body.length).toBeGreaterThan(100)
        expect(body.toString('ascii', 0, 2)).toBe('PK')
    })
})

// ─── DOCX ─────────────────────────────────────────────

test.describe('DOCX Export API', () => {
    test('generates strategy DOCX with correct content-type', async ({ page }) => {
        await loginAs(page)
        const res = await page.context().request.post('/api/exports/docx', {
            data: strategyPayload,
        })
        expect(res.status()).toBe(200)
        expect(res.headers()['content-type']).toContain('wordprocessingml.document')
        expect(res.headers()['content-disposition']).toContain('.docx')
        const body = await res.body()
        expect(body.length).toBeGreaterThan(100)
        expect(body.toString('ascii', 0, 2)).toBe('PK')
    })
})
