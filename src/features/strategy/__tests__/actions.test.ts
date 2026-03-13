import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ───────────────────────────────────────
const { mockGetUser, mockFrom, mockSingle, mockOrder, mockLimit, mockEq } = vi.hoisted(() => {
    const mockGetUser = vi.fn()
    const mockSingle = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    const mockEq = vi.fn()

    mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
        limit: mockLimit,
        select: vi.fn().mockReturnThis(),
    })
    mockOrder.mockReturnValue({ limit: mockLimit, data: [], error: null })
    mockLimit.mockResolvedValue({ data: [], error: null })

    const mockFrom = vi.fn().mockReturnValue({
        select: vi
            .fn()
            .mockReturnValue({
                eq: mockEq,
                single: mockSingle,
                order: mockOrder,
                limit: mockLimit,
            }),
        insert: vi
            .fn()
            .mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }),
        update: vi.fn().mockReturnValue({ eq: mockEq }),
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
    })

    return { mockGetUser, mockFrom, mockSingle, mockOrder, mockLimit, mockEq }
})

// ─── Module mocks ─────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/lib/permissions', () => ({
    getUserPermissions: vi
        .fn()
        .mockResolvedValue({
            role: 'user',
            isSuperadmin: false,
            features: { modules: ['intelligence'], intelViews: [] },
            limits: { maxReports: 10 },
            usage: { reportsUsed: 0 },
        }),
    canAccessModule: vi.fn().mockReturnValue(true),
}))
vi.mock('@/lib/brightdata', () => ({
    scrapeUrl: vi
        .fn()
        .mockResolvedValue(
            'Scraped content from competitor site with lots of relevant data for analysis and more text to exceed 100 chars threshold',
        ),
    serpSearch: vi.fn().mockResolvedValue('Search result for market research data'),
}))
vi.mock('@/lib/gemini', () => ({
    callGemini: vi.fn().mockResolvedValue(
        JSON.stringify({
            competitorAnalysis: [
                { name: 'Comp 1', strengths: ['a'], weaknesses: ['b'], mainMessage: 'msg' },
            ],
            marketInsights: {
                trends: ['trend1'],
                painPoints: ['pain1'],
                opportunities: ['opp1'],
                keywords: ['kw1'],
            },
            salesAngles: [
                {
                    name: 'Angle 1',
                    type: 'efficiency',
                    hook: 'Hook',
                    description: 'Desc',
                    adVariants: [{ headline: 'H', body: 'B' }],
                },
            ],
            landingBlueprint: {
                recommendedType: 'VSL',
                sections: [{ name: 'Hero', purpose: 'Attract', suggestedContent: 'Content' }],
            },
            adsStrategy: { platforms: ['Meta'], hooks: ['hook1'] },
            contentPillars: [{ pillar: 'Education', topics: ['t1'], tone: 'Professional' }],
        }),
    ),
    parseAndValidate: vi
        .fn()
        .mockImplementation((raw: string, schema: { parse: (v: unknown) => unknown }) =>
            schema.parse(JSON.parse(raw)),
        ),
    parseJsonFromAI: vi.fn().mockImplementation((raw: string) => JSON.parse(raw)),
}))
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    }),
}))

// ─── Import actions ───────────────────────────────────────
import {
    runStrategyAnalysisAction,
    fetchStrategyHistoryAction,
    loadStrategyHistoryItemAction,
    runTacticalOperationAction,
} from '../actions'
import type { StrategyBriefData } from '../types'

// ─── Tests ────────────────────────────────────────────────
describe('Strategy Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
        mockSingle.mockResolvedValue({
            data: {
                brand_name: 'TestBrand',
                services: [{ title: 'Service 1', description: 'Desc 1' }],
                differentiators: 'Unique value',
                faqs: [{ question: 'Q1', answer: 'A1' }],
                testimonials: [{ text: 'Great!', author: 'John' }],
                stats: [{ value: '100', label: 'clients' }],
                country: 'ar',
                candidate_name: null,
                party: null,
            },
            error: null,
        })
        mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
            order: mockOrder,
            limit: mockLimit,
            select: vi.fn().mockReturnThis(),
        })
    })

    // ─── runStrategyAnalysisAction ───────────────────────
    describe('runStrategyAnalysisAction', () => {
        it('requires authentication', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const brief: StrategyBriefData = {
                brandName: 'Test',
                sector: 'Tech',
                competitors: 'https://competitor1.com',
            }
            const result = await runStrategyAnalysisAction(brief)
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('requires brand identity or brandName', async () => {
            mockSingle.mockResolvedValue({ data: null, error: null })
            const brief: StrategyBriefData = {
                brandName: '',
                sector: 'Tech',
                competitors: 'https://competitor1.com',
            }
            const result = await runStrategyAnalysisAction(brief)
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('configuración de marca')
        })

        it('proceeds when brandName is in brief (no brand identity)', async () => {
            mockSingle.mockResolvedValueOnce({ data: null, error: null })
            const brief: StrategyBriefData = {
                brandName: 'MyBrand',
                sector: 'Ecommerce',
                competitors: 'https://competitor.com',
                country: 'ar',
            }
            const result = await runStrategyAnalysisAction(brief)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data!.strategy).toBeDefined()
                expect(result.data!.meta.brightDataUsed).toBe(true)
            }
        })

        it('extracts URLs from competitors string', async () => {
            const brief: StrategyBriefData = {
                brandName: 'TestBrand',
                sector: 'Tech',
                competitors: 'https://site1.com, https://site2.com',
            }
            const result = await runStrategyAnalysisAction(brief)
            expect(result.success).toBe(true)
        })

        it('handles empty competitors string', async () => {
            const brief: StrategyBriefData = {
                brandName: 'TestBrand',
                sector: 'Tech',
                competitors: '',
            }
            const result = await runStrategyAnalysisAction(brief)
            expect(result.success).toBe(true)
        })
    })

    // ─── fetchStrategyHistoryAction ──────────────────────
    describe('fetchStrategyHistoryAction', () => {
        it('requires authentication', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await fetchStrategyHistoryAction()
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('returns history items', async () => {
            mockLimit.mockResolvedValue({
                data: [
                    {
                        id: 'h1',
                        brief_data: { brandName: 'Test', sector: 'Tech', competitors: 'comp1' },
                        meta_data: {
                            competitorsScraped: 1,
                            totalCompetitors: 2,
                            hasMarketResearch: true,
                            generatedAt: '2026-01-01',
                        },
                        created_at: '2026-01-01',
                    },
                ],
                error: null,
            })
            const result = await fetchStrategyHistoryAction()
            expect(result.success).toBe(true)
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true)
                expect(result.data![0].id).toBe('h1')
            }
        })

        it('handles DB error', async () => {
            mockLimit.mockResolvedValue({ data: null, error: { message: 'DB error' } })
            const result = await fetchStrategyHistoryAction()
            expect(result.success).toBe(false)
        })
    })

    // ─── loadStrategyHistoryItemAction ───────────────────
    describe('loadStrategyHistoryItemAction', () => {
        it('requires authentication', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await loadStrategyHistoryItemAction('history-id')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('returns error for non-existent history item', async () => {
            mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
            const result = await loadStrategyHistoryItemAction('nonexistent-id')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('no encontrado')
        })

        it('loads a valid history item', async () => {
            mockSingle.mockResolvedValue({
                data: {
                    brief_data: { brandName: 'Test', sector: 'Tech', competitors: 'comp1' },
                    strategy_data: {
                        competitorAnalysis: [
                            { name: 'C1', strengths: ['a'], weaknesses: ['b'], mainMessage: 'msg' },
                        ],
                        marketInsights: { trends: ['t'], painPoints: ['p'], opportunities: ['o'] },
                        salesAngles: [
                            {
                                name: 'A1',
                                type: 'efficiency',
                                hook: 'H',
                                description: 'D',
                                adVariants: [{ headline: 'H', body: 'B' }],
                            },
                        ],
                        landingBlueprint: {
                            recommendedType: 'VSL',
                            sections: [{ name: 'Hero', purpose: 'P', suggestedContent: 'C' }],
                        },
                        adsStrategy: { platforms: ['Meta'], hooks: ['h'] },
                        contentPillars: [{ pillar: 'P', topics: ['t'], tone: 'T' }],
                    },
                    meta_data: {
                        competitorsScraped: 1,
                        totalCompetitors: 2,
                        hasMarketResearch: true,
                        generatedAt: '2026-01-01',
                    },
                },
                error: null,
            })
            const result = await loadStrategyHistoryItemAction('valid-id')
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data!.strategy.competitorAnalysis).toBeDefined()
                expect(result.data!.briefData.brandName).toBe('Test')
            }
        })
    })

    // ─── runTacticalOperationAction ──────────────────────
    describe('runTacticalOperationAction', () => {
        it('requires authentication for objections', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await runTacticalOperationAction('objections', 'Test angle', {
                brandName: 'Test',
                sector: 'Tech',
            })
            expect(result.success).toBe(false)
        })

        it('requires authentication for content', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await runTacticalOperationAction('content', 'Test angle', {
                brandName: 'Test',
                sector: 'Tech',
            })
            expect(result.success).toBe(false)
        })
    })
})
