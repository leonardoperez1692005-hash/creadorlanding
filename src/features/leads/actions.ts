'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, canAccessModule } from '@/lib/permissions'
import type { Lead } from './types'

export type LeadsActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

/** Lista los leads capturados de un proyecto, verificando propiedad y permisos de módulo. */
export async function fetchLeadsAction(projectId: string): Promise<LeadsActionResult<Lead[]>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'leads')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

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

/** Elimina un lead por ID (RLS valida propiedad vía project_id). */
export async function deleteLeadAction(leadId: string): Promise<LeadsActionResult> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'leads')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        // RLS enforces ownership via project_id join
        const { error } = await supabase.from('leads').delete().eq('id', leadId)
        if (error) throw error
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
