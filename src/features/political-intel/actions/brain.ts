'use server'

import { createClient } from '@/lib/supabase/server'
import { loadCampaignBrain } from '../brain'
import type { CampaignBrain } from '../brain'

export async function loadBrainAction(): Promise<{
    success: boolean
    data?: CampaignBrain
    error?: string
}> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const brain = await loadCampaignBrain(supabase, user.id)
        return { success: true, data: brain }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}
