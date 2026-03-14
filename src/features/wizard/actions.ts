'use server'

import { revalidatePath } from 'next/cache'
import { logger } from '@/shared/lib/logger'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserPermissions, hasReachedLimit } from '@/lib/permissions'
import { normalizeAndMergeSections } from './config/constants'
import { compileLandingHtml } from './lib/htmlCompiler'
import type { WizardSection, DesignColors, TrackingMeta } from './types'
import { headers } from 'next/headers'
import { loadCampaignBrain } from '@/features/political-intel/brain'

// === Schemas ===
const saveProjectSchema = z.object({
    projectId: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    structureType: z.string().min(1),
    visualModel: z.enum(['dark', 'light']),
    sections: z.array(
        z.object({
            id: z.string(),
            type: z.string(),
            content: z.record(z.string(), z.unknown()),
            isVisible: z.boolean(),
            order: z.number(),
        }),
    ),
    colors: z.record(z.string(), z.string()).optional(),
    meta: z.record(z.string(), z.string().optional()).optional(),
})

export type SaveProjectInput = z.infer<typeof saveProjectSchema>
export type ActionResult<T = null> = { success: true; data?: T } | { success: false; error: string }

/** Generate a clean slug from the project name, appending a short suffix only on collision. */
async function generateUniqueSlug(
    name: string,
    supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
    const base =
        name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // strip accents
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-{2,}/g, '-') // collapse multiple dashes
            .replace(/^-|-$/g, '') // trim dashes
            .slice(0, 60) || // limit length
        'landing'

    // Check if slug exists
    const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('slug', base)

    if (!count) return base

    // Collision: append short random suffix
    const suffix = Math.random().toString(36).slice(2, 6)
    return `${base}-${suffix}`
}

/** Carga un proyecto existente por ID, normalizando y fusionando secciones según su estructura. */
export async function fetchProjectAction(id: string): Promise<
    ActionResult<{
        name: string
        structureType: string
        visualModel: string
        sections: unknown[]
        colors: Record<string, string>
        meta: Record<string, string>
    }>
> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error || !data) return { success: false, error: 'Proyecto no encontrado' }

    const contentData =
        typeof data.content_data === 'string'
            ? JSON.parse(data.content_data)
            : ((data.content_data as Record<string, unknown>) ?? {})

    const rawSections = (contentData['sections'] as unknown[]) ?? []
    const sections = normalizeAndMergeSections(rawSections, data.structure_type)

    return {
        success: true,
        data: {
            name: data.name,
            structureType: data.structure_type,
            visualModel: data.visual_model,
            sections,
            colors: (contentData['colors'] as Record<string, string>) ?? {},
            meta: (contentData['meta'] as Record<string, string>) ?? {},
        },
    }
}

/** Guarda un proyecto (crea o actualiza). Valida límite de proyectos del plan al crear. */
export async function saveProjectAction(
    input: SaveProjectInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
    const parsed = saveProjectSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { projectId, name, structureType, visualModel, sections, colors, meta } = parsed.data

    const contentData = { sections, colors: colors ?? {}, meta: meta ?? {} }
    const slug = await generateUniqueSlug(name, supabase)

    // Get permissions (needed for limit check and superadmin bypass)
    const perms = await getUserPermissions(user.id)

    // Enforce project creation limit (only for new projects)
    if (!projectId && hasReachedLimit(perms, 'projects')) {
        return {
            success: false,
            error: `Límite de proyectos alcanzado (${perms.limits.maxProjects}). Contactá al administrador para ampliar tu plan.`,
        }
    }

    // Superadmin uses service client to bypass RLS (no active membership required)
    const dbClient = perms.isSuperadmin ? createServiceClient() : supabase

    if (projectId) {
        // UPDATE
        const { data, error } = await dbClient
            .from('projects')
            .update({
                name,
                structure_type: structureType,
                visual_model: visualModel,
                content_data: contentData,
            })
            .eq('id', projectId)
            .eq('user_id', user.id)
            .select('slug')
            .single()

        if (error || !data) return { success: false, error: 'Error al actualizar el proyecto' }
        // NOTE: no revalidatePath here — it causes the wizard to re-render and kick the user out.
        // Dashboard uses force-dynamic so it always fetches fresh data.
        return { success: true, data: { id: projectId, slug: data.slug } }
    } else {
        // CREATE
        const { data, error } = await dbClient
            .from('projects')
            .insert({
                slug,
                name,
                structure_type: structureType,
                visual_model: visualModel,
                content_data: contentData,
                user_id: user.id,
            })
            .select('id, slug')
            .single()

        if (error || !data) return { success: false, error: 'Error al crear el proyecto' }
        return { success: true, data: { id: data.id, slug: data.slug } }
    }
}

/** Obtiene los colores de la identidad de marca del usuario para pre-popular el wizard. */
export async function fetchBrandColorsAction(): Promise<Record<string, string>> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return {}

    const { data } = await supabase
        .from('brand_identities')
        .select('design_tokens')
        .eq('user_id', user.id)
        .single()

    if (!data) return {}
    const tokens = data.design_tokens as Record<string, unknown>
    return (tokens['colors'] as Record<string, string>) ?? {}
}

/** Obtiene defaults de campaña del brain para pre-popular el wizard (colores + candidato + estilo). */
export async function fetchCampaignDefaultsAction(): Promise<{
    colors: Record<string, string>
    candidateName: string
    brandName: string
    tagline: string
    party: string
    communicationStyle: string
} | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const brain = await loadCampaignBrain(supabase, user.id)
    if (!brain.campaign && !brain.visual) return null

    const colors: Record<string, string> = {}
    if (brain.visual) {
        if (brain.visual.primaryColor) colors.primary = brain.visual.primaryColor
        if (brain.visual.secondaryColor) colors.secondary = brain.visual.secondaryColor
        if (brain.visual.accentColor) colors.accent = brain.visual.accentColor
    }

    return {
        colors,
        candidateName: brain.campaign?.candidateName ?? '',
        brandName: brain.visual?.brandName ?? '',
        tagline: brain.visual?.tagline ?? '',
        party: brain.campaign?.party ?? '',
        communicationStyle: brain.campaign?.communicationStyle ?? '',
    }
}

/** Guarda y publica un proyecto: compila HTML standalone y revalida rutas públicas. */
export async function publishProjectAction(
    input: SaveProjectInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
    const parsed = saveProjectSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { projectId, name, structureType, visualModel, sections, colors, meta } = parsed.data

    const contentData = { sections, colors: colors ?? {}, meta: meta ?? {} }
    const slug = await generateUniqueSlug(name, supabase)

    // Superadmin uses service client to bypass RLS (no active membership required)
    const perms = await getUserPermissions(user.id)
    const dbClient = perms.isSuperadmin ? createServiceClient() : supabase

    // Resolve base URL for API endpoints embedded in HTML
    const h = await headers()
    const host = h.get('host') || 'localhost:3000'
    const protocol = h.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`

    // Compile standalone HTML
    const htmlOutput = compileLandingHtml({
        projectId: projectId || 'pending',
        projectName: name,
        visualModel: visualModel as 'dark' | 'light',
        sections: sections as WizardSection[],
        colors: (colors ?? {}) as DesignColors,
        meta: (meta ?? {}) as TrackingMeta,
        baseUrl,
    })

    if (projectId) {
        const { data, error } = await dbClient
            .from('projects')
            .update({
                name,
                structure_type: structureType,
                visual_model: visualModel,
                content_data: contentData,
                html_output: htmlOutput,
            })
            .eq('id', projectId)
            .eq('user_id', user.id)
            .select('slug')
            .single()

        if (error || !data) return { success: false, error: 'Error al publicar el proyecto' }
        revalidatePath('/dashboard')
        revalidatePath(`/p/${data.slug}`)
        return { success: true, data: { id: projectId, slug: data.slug } }
    } else {
        // For new projects, compile again with the real project ID
        const { data, error } = await dbClient
            .from('projects')
            .insert({
                slug,
                name,
                structure_type: structureType,
                visual_model: visualModel,
                content_data: contentData,
                html_output: htmlOutput,
                user_id: user.id,
            })
            .select('id, slug')
            .single()

        if (error || !data)
            return { success: false, error: 'Error al crear y publicar el proyecto' }

        // Re-compile with real project ID for the lead capture form
        const finalHtml = compileLandingHtml({
            projectId: data.id,
            projectName: name,
            visualModel: visualModel as 'dark' | 'light',
            sections: sections as WizardSection[],
            colors: (colors ?? {}) as DesignColors,
            meta: (meta ?? {}) as TrackingMeta,
            baseUrl,
        })
        await dbClient
            .from('projects')
            .update({ html_output: finalHtml })
            .eq('id', data.id)
            .eq('user_id', user.id)

        revalidatePath('/dashboard')
        return { success: true, data: { id: data.id, slug: data.slug } }
    }
}

/** Despublica un proyecto eliminando su HTML compilado (vuelve a borrador). */
export async function unpublishProjectAction(projectId: string): Promise<ActionResult> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
        .from('projects')
        .update({ html_output: null })
        .eq('id', projectId)
        .eq('user_id', user.id)

    if (error) return { success: false, error: 'Error al despublicar el proyecto' }

    revalidatePath('/dashboard')
    return { success: true }
}

/** Elimina un proyecto permanentemente. */
export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id)

    if (error) return { success: false, error: 'Error al eliminar el proyecto' }

    revalidatePath('/dashboard')
    return { success: true }
}

/** Sube una imagen para un proyecto al bucket de Storage (máx 5MB). */
export async function uploadProjectImageAction(
    formData: FormData,
): Promise<ActionResult<{ url: string }>> {
    try {
        const file = formData.get('file') as File | null
        if (!file) return { success: false, error: 'No se recibió archivo.' }

        if (file.size > 5 * 1024 * 1024)
            return { success: false, error: 'La imagen no puede pesar más de 5MB.' }
        if (!file.type.startsWith('image/'))
            return { success: false, error: 'El archivo debe ser una imagen válida.' }

        // Auth check with user client
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // Upload with service client (bypasses RLS — bucket policies may not be applied yet)
        const admin = createServiceClient()
        const ext = file.name.split('.').pop() || 'jpg'
        const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

        const { error } = await admin.storage
            .from('project-images')
            .upload(filename, file, { upsert: true })

        if (error) {
            logger.error('wizard', 'Storage upload error', error)
            return { success: false, error: 'Error subiendo la imagen.' }
        }

        const { data: publicUrlData } = admin.storage.from('project-images').getPublicUrl(filename)

        return { success: true, data: { url: publicUrlData.publicUrl } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
