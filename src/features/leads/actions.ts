'use server'

import { createClient } from '@/lib/supabase/server'
import type { Lead } from './types'

export type LeadsActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

export async function fetchLeadsAction(projectId: string): Promise<LeadsActionResult<Lead[]>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // Verify ownership
        const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (!project) return { success: false, error: 'Proyecto no encontrado' }

        const { data, error } = await supabase
            .from('leads')
            .select('id, name, email, phone, source, message, created_at')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data: (data ?? []) as Lead[] }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function deleteLeadAction(leadId: string): Promise<LeadsActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // RLS enforces ownership via project_id join
        const { error } = await supabase.from('leads').delete().eq('id', leadId)
        if (error) throw error
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
