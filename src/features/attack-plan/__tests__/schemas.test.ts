import { describe, it, expect } from 'vitest'
import { attackPlanSchema, attackVectorSchema } from '../schemas'

describe('attackVectorSchema', () => {
    const validVector = {
        rivalName: 'CompetitorX',
        rivalWeakness: 'No mobile app',
        brandStrength: 'Mobile-first platform',
        attackAngle: 'Superior mobile experience',
        outputs: {
            adCopy: {
                headline: 'Your business, in your pocket',
                body: 'While others make you wait, we deliver instantly.',
                cta: 'Try the app free',
            },
            tiktokScript: {
                hook: 'POV: your competitor doesnt have an app',
                script: 'Full script here with 30 seconds of content...',
                cta: 'Download now, link in bio',
            },
            linkedinPost: {
                hook: 'The mobile gap is costing companies millions.',
                body: 'Full LinkedIn post with insights...',
                hashtags: ['MobileFirst', 'Innovation'],
            },
            landingSectionCopy: {
                heroHeadline: 'Business Without Limits',
                heroSubheadline: 'Access everything from your phone',
                benefitTitle: 'Always Available',
                benefitDescription: 'No more waiting for desktop access.',
                urgencyText: 'Limited early-access pricing',
            },
        },
    }

    it('validates a correct AttackVector', () => {
        const result = attackVectorSchema.safeParse(validVector)
        expect(result.success).toBe(true)
    })

    it('rejects missing outputs', () => {
        const { outputs, ...missing } = validVector
        const result = attackVectorSchema.safeParse(missing)
        expect(result.success).toBe(false)
    })

    it('rejects missing adCopy fields', () => {
        const bad = structuredClone(validVector)
        delete (bad.outputs.adCopy as Record<string, unknown>).headline
        const result = attackVectorSchema.safeParse(bad)
        expect(result.success).toBe(false)
    })
})

describe('attackPlanSchema', () => {
    const validPlan = {
        executiveSummary: 'ZMOT strategy summary',
        attackMatrix: [{
            rivalName: 'X',
            rivalWeakness: 'W',
            brandStrength: 'S',
            attackAngle: 'A',
            outputs: {
                adCopy: { headline: 'H', body: 'B', cta: 'C' },
                tiktokScript: { hook: 'H', script: 'S', cta: 'C' },
                linkedinPost: { hook: 'H', body: 'B', hashtags: ['tag'] },
                landingSectionCopy: {
                    heroHeadline: 'HH',
                    heroSubheadline: 'HS',
                    benefitTitle: 'BT',
                    benefitDescription: 'BD',
                    urgencyText: 'UT',
                },
            },
        }],
        overallStrategy: 'Overall approach',
        recommendedLandingType: 'vsl',
        landingContent: { hero: { headline: 'Test' } },
    }

    it('validates a correct AttackPlan', () => {
        const result = attackPlanSchema.safeParse(validPlan)
        expect(result.success).toBe(true)
    })

    it('rejects invalid recommendedLandingType', () => {
        const bad = { ...validPlan, recommendedLandingType: 'unknown' }
        const result = attackPlanSchema.safeParse(bad)
        expect(result.success).toBe(false)
    })

    it('rejects missing attackMatrix', () => {
        const { attackMatrix, ...missing } = validPlan
        const result = attackPlanSchema.safeParse(missing)
        expect(result.success).toBe(false)
    })

    it('accepts all three landing types', () => {
        for (const type of ['vsl', 'webinar', 'long_letter']) {
            const plan = { ...validPlan, recommendedLandingType: type }
            const result = attackPlanSchema.safeParse(plan)
            expect(result.success).toBe(true)
        }
    })
})
