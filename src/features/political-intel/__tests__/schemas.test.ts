import { describe, it, expect } from 'vitest'
import { campaignProfileInputSchema, monitorInputSchema, profileChangeSchema } from '../schemas'

describe('campaignProfileInputSchema', () => {
    it('validates a complete valid profile', () => {
        const result = campaignProfileInputSchema.safeParse({
            campaignName: 'Frente Renovador 2027',
            candidateName: 'María García',
            party: 'Frente Renovador',
            ideologySpectrum: 'centro-izquierda',
            corePositions: [{ issue: 'economía', position: 'intervención moderada' }],
            targetVoters: 'Trabajadores formales 25-45 años',
            communicationStyle: 'propositivo',
            country: 'ar',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing campaignName', () => {
        const result = campaignProfileInputSchema.safeParse({
            candidateName: 'María García',
            party: 'FR',
            ideologySpectrum: 'centro',
            corePositions: [{ issue: 'eco', position: 'pos' }],
            targetVoters: 'Trabajadores formales',
        })
        expect(result.success).toBe(false)
    })

    it('rejects empty corePositions', () => {
        const result = campaignProfileInputSchema.safeParse({
            campaignName: 'Test Campaign',
            candidateName: 'Test',
            party: 'Test',
            ideologySpectrum: 'centro',
            corePositions: [],
            targetVoters: 'Votantes',
        })
        expect(result.success).toBe(false)
    })

    it('applies defaults for optional fields', () => {
        const result = campaignProfileInputSchema.safeParse({
            campaignName: 'Test Campaign',
            candidateName: 'Test Candidate',
            party: 'Test Party',
            ideologySpectrum: 'centro',
            corePositions: [{ issue: 'tema', position: 'posición' }],
            targetVoters: 'Votantes generales',
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.keyProposals).toEqual([])
            expect(result.data.coalitionAllies).toEqual([])
            expect(result.data.redLines).toEqual([])
            expect(result.data.toneGuidelines).toBe('')
            expect(result.data.communicationStyle).toBe('propositivo')
            expect(result.data.country).toBe('ar')
        }
    })

    it('validates all communication styles', () => {
        const styles = ['propositivo', 'confrontativo', 'tecnico', 'popular'] as const
        for (const style of styles) {
            const result = campaignProfileInputSchema.safeParse({
                campaignName: 'Test',
                candidateName: 'Test',
                party: 'T',
                ideologySpectrum: 'centro',
                corePositions: [{ issue: 'x', position: 'y' }],
                targetVoters: 'Votantes',
                communicationStyle: style,
            })
            expect(result.success).toBe(true)
        }
    })
})

describe('monitorInputSchema', () => {
    it('validates a complete monitor', () => {
        const result = monitorInputSchema.safeParse({
            handle: '@jmilei',
            fullName: 'Javier Milei',
            party: 'LLA',
            role: 'Presidente',
            country: 'ar',
            platform: 'twitter',
        })
        expect(result.success).toBe(true)
    })

    it('strips @ from handle', () => {
        const result = monitorInputSchema.safeParse({
            handle: '@testuser',
            fullName: 'Test User',
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.handle).toBe('testuser')
        }
    })

    it('rejects empty handle', () => {
        const result = monitorInputSchema.safeParse({
            handle: '',
            fullName: 'Test User',
        })
        expect(result.success).toBe(false)
    })

    it('applies defaults', () => {
        const result = monitorInputSchema.safeParse({
            handle: 'testuser',
            fullName: 'Test User',
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.party).toBe('')
            expect(result.data.role).toBe('')
            expect(result.data.country).toBe('ar')
            expect(result.data.platform).toBe('twitter')
            expect(result.data.isActive).toBe(true)
        }
    })
})

describe('profileChangeSchema', () => {
    it('validates a numeric change', () => {
        const result = profileChangeSchema.safeParse({
            field: 'followers',
            previousValue: 100000,
            currentValue: 120000,
            changePercent: 20,
            significance: 'high',
        })
        expect(result.success).toBe(true)
    })

    it('validates a string change', () => {
        const result = profileChangeSchema.safeParse({
            field: 'bio',
            previousValue: 'Old bio',
            currentValue: 'New bio',
            significance: 'high',
        })
        expect(result.success).toBe(true)
    })

    it('allows optional changePercent', () => {
        const result = profileChangeSchema.safeParse({
            field: 'displayName',
            previousValue: 'Old Name',
            currentValue: 'New Name',
            significance: 'medium',
        })
        expect(result.success).toBe(true)
    })
})
