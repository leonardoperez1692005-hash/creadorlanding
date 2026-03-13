'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { getUserPermissions, canAccessModule } from '@/lib/permissions'
import { mapTopic, type ActionResult, type PoliticalTopic } from '../types'
import { topicInputSchema } from '../schemas'
import { getAuthUserId } from './auth'

// =============================================
// THEMATIC INTELLIGENCE — TOPICS CRUD
// =============================================

/** Agrega un tema de investigación temática con nombre, descripción, context prompt y queries SERP. */
export async function addTopicAction(input: {
    name: string
    description?: string
    contextPrompt?: string
    serpQueries?: string[]
    isActive?: boolean
}): Promise<ActionResult<{ id: string }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const perms = await getUserPermissions(userId)
    if (!canAccessModule(perms, 'intelligence')) {
        return { success: false, error: 'No tienes acceso a este módulo' }
    }

    const parsed = topicInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('political_topics')
        .insert({
            user_id: userId,
            name: parsed.data.name,
            description: parsed.data.description,
            context_prompt: parsed.data.contextPrompt,
            serp_queries: parsed.data.serpQueries,
            is_active: parsed.data.isActive,
        })
        .select('id')
        .single()

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: `Ya existe un tema llamado "${parsed.data.name}"` }
        }
        logger.error('thematic-intel', 'Error adding topic', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: { id: data.id } }
}

/** Elimina un tema de investigación del usuario autenticado. */
export async function deleteTopicAction(id: string): Promise<ActionResult<undefined>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const perms = await getUserPermissions(userId)
    if (!canAccessModule(perms, 'intelligence')) {
        return { success: false, error: 'No tienes acceso a este módulo' }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('political_topics')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

    if (error) {
        logger.error('thematic-intel', 'Error deleting topic', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
}

/** Actualiza nombre, descripción o context prompt de un tema existente. */
export async function updateTopicAction(
    topicId: string,
    input: { name?: string; description?: string; contextPrompt?: string },
): Promise<ActionResult<undefined>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const perms = await getUserPermissions(userId)
    if (!canAccessModule(perms, 'intelligence')) {
        return { success: false, error: 'No tienes acceso a este módulo' }
    }

    const supabase = await createClient()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.name !== undefined) update.name = input.name
    if (input.description !== undefined) update.description = input.description
    if (input.contextPrompt !== undefined) update.context_prompt = input.contextPrompt

    const { error } = await supabase
        .from('political_topics')
        .update(update)
        .eq('id', topicId)
        .eq('user_id', userId)

    if (error) {
        logger.error('thematic-intel', 'Error updating topic', error)
        return { success: false, error: error.message }
    }
    return { success: true, data: undefined }
}

/** Lista los temas activos del usuario, ordenados por fecha de creación. */
export async function listTopicsAction(): Promise<ActionResult<PoliticalTopic[]>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('political_topics')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    if (error) {
        logger.error('thematic-intel', 'Error listing topics', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: (data ?? []).map(mapTopic) }
}
