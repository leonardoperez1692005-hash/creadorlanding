'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { type ActionResult } from '../types'
import { getAuthUserId } from './auth'
import { type ChatSession, type ChatSessionWithMessages } from '../chatSessionTypes'

// ─── Create Session ─────────────────────────────────

export async function createChatSessionAction(input: {
    title: string
    messagesJson: unknown[]
}): Promise<ActionResult<{ id: string }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('strategic_chat_sessions')
            .insert({
                user_id: userId,
                title: input.title.trim() || 'Nueva conversacion',
                messages_json: JSON.parse(JSON.stringify(input.messagesJson)),
                message_count: input.messagesJson.length,
            })
            .select('id')
            .single()

        if (error) {
            logger.error('chat-sessions', 'Create failed', error)
            return { success: false, error: 'Error creando sesion' }
        }

        return { success: true, data: { id: data.id as string } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── Update Session (save messages) ─────────────────

export async function updateChatSessionAction(input: {
    sessionId: string
    messagesJson: unknown[]
    title?: string
}): Promise<ActionResult<undefined>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const updateData: Record<string, unknown> = {
            messages_json: JSON.parse(JSON.stringify(input.messagesJson)),
            message_count: input.messagesJson.length,
        }

        if (input.title) {
            updateData.title = input.title.trim()
        }

        const { error } = await supabase
            .from('strategic_chat_sessions')
            .update(updateData)
            .eq('id', input.sessionId)
            .eq('user_id', userId)

        if (error) {
            logger.error('chat-sessions', 'Update failed', error)
            return { success: false, error: 'Error guardando sesion' }
        }

        return { success: true, data: undefined }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── List Sessions ──────────────────────────────────

export async function listChatSessionsAction(): Promise<ActionResult<ChatSession[]>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('strategic_chat_sessions')
            .select('id, title, message_count, created_at, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(50)

        if (error) {
            logger.error('chat-sessions', 'List failed', error)
            return { success: false, error: 'Error listando sesiones' }
        }

        return {
            success: true,
            data: (data ?? []).map((r) => ({
                id: r.id as string,
                title: r.title as string,
                messageCount: r.message_count as number,
                createdAt: r.created_at as string,
                updatedAt: r.updated_at as string,
            })),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── Load Session (with messages) ───────────────────

export async function loadChatSessionAction(
    sessionId: string,
): Promise<ActionResult<ChatSessionWithMessages>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('strategic_chat_sessions')
            .select('id, title, messages_json, message_count, created_at, updated_at')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single()

        if (error) {
            logger.error('chat-sessions', 'Load failed', error)
            return { success: false, error: 'Error cargando sesion' }
        }

        return {
            success: true,
            data: {
                id: data.id as string,
                title: data.title as string,
                messagesJson: data.messages_json as unknown[],
                messageCount: data.message_count as number,
                createdAt: data.created_at as string,
                updatedAt: data.updated_at as string,
            },
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── Delete Session ─────────────────────────────────

export async function deleteChatSessionAction(sessionId: string): Promise<ActionResult<undefined>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { error } = await supabase
            .from('strategic_chat_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', userId)

        if (error) {
            logger.error('chat-sessions', 'Delete failed', error)
            return { success: false, error: 'Error eliminando sesion' }
        }

        return { success: true, data: undefined }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}
