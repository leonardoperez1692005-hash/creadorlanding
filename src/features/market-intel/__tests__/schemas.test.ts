import { describe, it, expect } from 'vitest'
import { intelReportSchema, competitorTargetSchema, intelReportMetaSchema } from '../schemas'

describe('intelReportSchema', () => {
    const validReport = {
        executiveSummary: 'Summary here',
        competitors: [{
            name: 'Rival Corp',
            strengths: ['brand recognition'],
            weaknesses: ['slow support'],
            positioning: 'Premium market',
            vulnerabilities: [{
                weakness: 'slow support',
                exploitAngle: 'Offer 24/7 support',
                severity: 'high',
            }],
        }],
        marketContext: {
            trends: ['AI adoption'],
            painPoints: ['high prices'],
            opportunities: ['new segment'],
            sentiment: 'cautious',
        },
        recommendedAttackVectors: [{
            rivalName: 'Rival Corp',
            weakness: 'slow support',
            suggestedAngle: 'Speed advantage',
            priority: 'high',
        }],
    }

    it('validates a correct IntelReport', () => {
        const result = intelReportSchema.safeParse(validReport)
        expect(result.success).toBe(true)
    })

    it('rejects missing executiveSummary', () => {
        const { executiveSummary, ...missing } = validReport
        const result = intelReportSchema.safeParse(missing)
        expect(result.success).toBe(false)
    })

    it('rejects invalid severity value', () => {
        const bad = structuredClone(validReport)
        bad.competitors[0].vulnerabilities[0].severity = 'extreme' as 'critical'
        const result = intelReportSchema.safeParse(bad)
        expect(result.success).toBe(false)
    })

    it('rejects missing competitors array', () => {
        const { competitors, ...missing } = validReport
        const result = intelReportSchema.safeParse(missing)
        expect(result.success).toBe(false)
    })

    it('fills optional fields with defaults', () => {
        const minimal = structuredClone(validReport)
        delete (minimal.competitors[0] as Record<string, unknown>).communicationStyle
        const result = intelReportSchema.safeParse(minimal)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.competitors[0].communicationStyle).toBe('')
        }
    })
})

describe('competitorTargetSchema', () => {
    it('validates a target with all fields', () => {
        const result = competitorTargetSchema.safeParse({
            name: 'Competitor X',
            url: 'https://competitorx.com',
            socialHandle: '@compx',
            socialPlatform: 'twitter',
            type: 'direct',
        })
        expect(result.success).toBe(true)
    })

    it('validates a minimal target', () => {
        const result = competitorTargetSchema.safeParse({
            name: 'Simple',
            type: 'indirect',
        })
        expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
        const result = competitorTargetSchema.safeParse({
            name: '',
            type: 'direct',
        })
        expect(result.success).toBe(false)
    })

    it('rejects invalid type', () => {
        const result = competitorTargetSchema.safeParse({
            name: 'Test',
            type: 'unknown',
        })
        expect(result.success).toBe(false)
    })
})

describe('intelReportMetaSchema', () => {
    it('validates correct meta', () => {
        const result = intelReportMetaSchema.safeParse({
            targetsTotal: 3,
            targetsSuccessful: 2,
            serpQueriesRun: 3,
            brightDataRequests: 6,
            estimatedCost: '$0.009',
            generatedAt: '2026-03-05T10:00:00Z',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing fields', () => {
        const result = intelReportMetaSchema.safeParse({ targetsTotal: 3 })
        expect(result.success).toBe(false)
    })
})
