'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { getUserPermissions, canAccessModule } from '@/lib/permissions'
import { type ActionResult, type PoliticalMonitor, type PoliticalMonitorInput } from '../types'
import { monitorInputSchema } from '../schemas'
import { mapMonitor } from './helpers'
import { getAuthUserId } from './auth'

// =============================================
// MONITORS CRUD
// =============================================

/** Agrega un monitor político (rival) validando permisos y unicidad del handle. */
export async function addMonitorAction(
    input: PoliticalMonitorInput,
): Promise<ActionResult<{ id: string }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(userId)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        const parsed = monitorInputSchema.safeParse(input)
        if (!parsed.success)
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('political_monitors')
            .insert({
                user_id: userId,
                handle: parsed.data.handle,
                full_name: parsed.data.fullName,
                party: parsed.data.party,
                role: parsed.data.role,
                country: parsed.data.country,
                platform: parsed.data.platform,
                serp_queries: parsed.data.serpQueries,
                is_active: parsed.data.isActive,
            })
            .select('id')
            .single()

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Este handle ya está siendo monitoreado' }
            }
            logger.error('political-intel', 'Error adding monitor', error)
            return { success: false, error: 'Error agregando monitor' }
        }

        return { success: true, data: { id: data.id } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

/** Elimina un monitor político del usuario autenticado. */
export async function deleteMonitorAction(id: string): Promise<ActionResult<undefined>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(userId)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('political_monitors')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            logger.error('political-intel', 'Error deleting monitor', error)
            return { success: false, error: 'Error eliminando monitor' }
        }

        return { success: true, data: undefined }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

/** Lista todos los monitors políticos del usuario, ordenados por fecha de creación. */
export async function listMonitorsAction(): Promise<ActionResult<PoliticalMonitor[]>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('political_monitors')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

        if (error) {
            logger.error('political-intel', 'Error listing monitors', error)
            return { success: false, error: 'Error listando monitors' }
        }

        return {
            success: true,
            data: (data ?? []).map(mapMonitor),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}
