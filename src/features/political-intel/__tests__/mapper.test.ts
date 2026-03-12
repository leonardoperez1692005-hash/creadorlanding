import { describe, it, expect } from 'vitest'
import { mapBrandIdentityToCampaignProfile } from '../types'

describe('mapBrandIdentityToCampaignProfile', () => {
    it('returns null when no political data exists', () => {
        const row = {
            id: '123',
            user_id: 'u1',
            brand_name: 'Mi Marca',
            sector: 'Tech',
            campaign_name: null,
            candidate_name: null,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
        }
        expect(mapBrandIdentityToCampaignProfile(row)).toBeNull()
    })

    it('returns null when political fields are empty strings', () => {
        const row = {
            id: '123',
            user_id: 'u1',
            campaign_name: '',
            candidate_name: '',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
        }
        expect(mapBrandIdentityToCampaignProfile(row)).toBeNull()
    })

    it('maps a complete brand_identities row to PoliticalCampaignProfile', () => {
        const row = {
            id: 'bid-1',
            user_id: 'uid-1',
            brand_name: 'Frente Renovador',
            sector: 'Política',
            campaign_name: 'Frente Renovador 2027',
            candidate_name: 'María García',
            party: 'Frente Renovador',
            ideology_spectrum: 'centro-izquierda',
            core_positions: [{ issue: 'economía', position: 'intervención moderada' }],
            key_proposals: [{ title: 'Salario mínimo', description: 'Aumento progresivo' }],
            target_voters: 'Trabajadores formales 25-45',
            coalition_allies: ['Partido X', 'Movimiento Y'],
            red_lines: ['No atacar por religión'],
            tone_guidelines: 'Firme pero propositivo',
            communication_style: 'propositivo',
            country: 'ar',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-03-10T00:00:00Z',
        }

        const result = mapBrandIdentityToCampaignProfile(row)

        expect(result).not.toBeNull()
        expect(result!.id).toBe('bid-1')
        expect(result!.userId).toBe('uid-1')
        expect(result!.campaignName).toBe('Frente Renovador 2027')
        expect(result!.candidateName).toBe('María García')
        expect(result!.party).toBe('Frente Renovador')
        expect(result!.ideologySpectrum).toBe('centro-izquierda')
        expect(result!.corePositions).toEqual([
            { issue: 'economía', position: 'intervención moderada' },
        ])
        expect(result!.keyProposals).toEqual([
            { title: 'Salario mínimo', description: 'Aumento progresivo' },
        ])
        expect(result!.targetVoters).toBe('Trabajadores formales 25-45')
        expect(result!.coalitionAllies).toEqual(['Partido X', 'Movimiento Y'])
        expect(result!.redLines).toEqual(['No atacar por religión'])
        expect(result!.toneGuidelines).toBe('Firme pero propositivo')
        expect(result!.communicationStyle).toBe('propositivo')
        expect(result!.country).toBe('ar')
    })

    it('applies defaults for missing optional fields', () => {
        const row = {
            id: 'bid-2',
            user_id: 'uid-2',
            campaign_name: 'Campaña Test',
            candidate_name: 'Test Candidate',
            // All other political fields missing
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
        }

        const result = mapBrandIdentityToCampaignProfile(row)

        expect(result).not.toBeNull()
        expect(result!.party).toBe('')
        expect(result!.ideologySpectrum).toBe('')
        expect(result!.corePositions).toEqual([])
        expect(result!.keyProposals).toEqual([])
        expect(result!.targetVoters).toBe('')
        expect(result!.coalitionAllies).toEqual([])
        expect(result!.redLines).toEqual([])
        expect(result!.toneGuidelines).toBe('')
        expect(result!.communicationStyle).toBe('propositivo')
        expect(result!.country).toBe('ar')
    })

    it('maps when only candidate_name exists (no campaign_name)', () => {
        const row = {
            id: 'bid-3',
            user_id: 'uid-3',
            campaign_name: null,
            candidate_name: 'Solo Candidato',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
        }

        const result = mapBrandIdentityToCampaignProfile(row)
        expect(result).not.toBeNull()
        expect(result!.candidateName).toBe('Solo Candidato')
        expect(result!.campaignName).toBe('')
    })
})
