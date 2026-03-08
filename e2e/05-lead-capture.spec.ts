import { test, expect } from '@playwright/test'
import { RUN_ID } from './helpers'

test.describe('Lead Capture API — /api/leads/capture', () => {
    test('rejects request with missing required fields', async ({ request }) => {
        const response = await request.post('/api/leads/capture', {
            data: {},
        })
        expect(response.status()).toBe(400)
    })

    test('rejects request without email', async ({ request }) => {
        const response = await request.post('/api/leads/capture', {
            data: {
                projectId: '00000000-0000-0000-0000-000000000000',
                name: 'Test Lead',
            },
        })
        expect(response.status()).toBe(400)
    })

    test('rejects request with invalid email', async ({ request }) => {
        const response = await request.post('/api/leads/capture', {
            data: {
                projectId: '00000000-0000-0000-0000-000000000000',
                email: 'not-an-email',
            },
        })
        expect(response.status()).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('inválido')
    })

    test('rejects request with invalid projectId', async ({ request }) => {
        const response = await request.post('/api/leads/capture', {
            data: {
                projectId: 'not-a-uuid',
                email: `lead-${RUN_ID}@test.local`,
            },
        })
        expect(response.status()).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('inválido')
    })

    test('returns 404 for non-existent project', async ({ request }) => {
        const response = await request.post('/api/leads/capture', {
            data: {
                projectId: '00000000-0000-0000-0000-000000000000',
                email: `lead-${RUN_ID}@test.local`,
                name: 'Test Lead',
            },
        })
        expect(response.status()).toBe(404)
        const body = await response.json()
        expect(body.error).toContain('no encontrado')
    })

    test('handles CORS preflight', async ({ request }) => {
        const response = await request.fetch('/api/leads/capture', {
            method: 'OPTIONS',
            headers: {
                Origin: 'https://example.com',
                'Access-Control-Request-Method': 'POST',
            },
        })
        expect(response.status()).toBe(204)
        expect(response.headers()['access-control-allow-methods']).toContain('POST')
    })
})
