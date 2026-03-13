'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { getUserPermissions, canAccessModule } from '@/lib/permissions'
import {
    mapBrandIdentityToCampaignProfile,
    type ActionResult,
    type PoliticalCampaignProfile,
    type PoliticalCampaignProfileInput,
} from '../types'
import { campaignProfileInputSchema } from '../schemas'
import { getAuthUserId } from './auth'

// =============================================
// CAMPAIGN PROFILE (client identity)
// =============================================

/** Guarda el perfil de campaña política del usuario autenticado (upsert en brand_identities). */
export async function saveCampaignProfileAction(
    input: PoliticalCampaignProfileInput,
): Promise<ActionResult<{ id: string }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(userId)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        const parsed = campaignProfileInputSchema.safeParse(input)
        if (!parsed.success)
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('brand_identities')
            .upsert(
                {
                    user_id: userId,
                    campaign_name: parsed.data.campaignName,
                    candidate_name: parsed.data.candidateName,
                    party: parsed.data.party,
                    ideology_spectrum: parsed.data.ideologySpectrum,
                    core_positions: parsed.data.corePositions,
                    key_proposals: parsed.data.keyProposals,
                    target_voters: parsed.data.targetVoters,
                    coalition_allies: parsed.data.coalitionAllies,
                    red_lines: parsed.data.redLines,
                    tone_guidelines: parsed.data.toneGuidelines,
                    communication_style: parsed.data.communicationStyle,
                    country: parsed.data.country,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            )
            .select('id')
            .single()

        if (error) {
            logger.error('political-intel', 'Error saving campaign profile', error)
            return { success: false, error: 'Error guardando perfil de campaña' }
        }

        return { success: true, data: { id: data.id } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

/** Obtiene el perfil de campaña política del usuario (null si no existe). */
export async function getCampaignProfileAction(): Promise<
    ActionResult<PoliticalCampaignProfile | null>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') {
            logger.error('political-intel', 'Error fetching campaign profile', error)
            return { success: false, error: 'Error obteniendo perfil de campaña' }
        }

        if (!data) return { success: true, data: null }

        // Map unified brand_identities row to political campaign DTO
        const profile = mapBrandIdentityToCampaignProfile(data)
        return { success: true, data: profile }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}
