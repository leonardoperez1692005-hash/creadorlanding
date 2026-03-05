'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { normalizeAndMergeSections } from './config/constants'
import { compileLandingHtml } from './lib/htmlCompiler'
import type { WizardSection, DesignColors, TrackingMeta } from './types'
import { headers } from 'next/headers'

// === Schemas ===
const createProjectSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    structureType: z.string().min(1),
    visualModel: z.enum(['dark', 'light']).default('dark'),
})

const saveProjectSchema = z.object({
    projectId: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    structureType: z.string().min(1),
    visualModel: z.enum(['dark', 'light']),
    sections: z.array(z.object({
        id: z.string(),
        type: z.string(),
        content: z.record(z.string(), z.unknown()),
        isVisible: z.boolean(),
        order: z.number(),
    })),
    colors: z.record(z.string(), z.string()).optional(),
    meta: z.record(z.string(), z.string().optional()).optional(),
})

export type SaveProjectInput = z.infer<typeof saveProjectSchema>
export type ActionResult<T = null> = { success: true; data?: T } | { success: false; error: string }

// === Fetch Project ===
export async function fetchProjectAction(id: string): Promise<ActionResult<{
    name: string
    structureType: string
    visualModel: string
    sections: unknown[]
    colors: Record<string, string>
    meta: Record<string, string>
}>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error || !data) return { success: false, error: 'Proyecto no encontrado' }

    const contentData = typeof data.content_data === 'string'
        ? JSON.parse(data.content_data)
        : (data.content_data as Record<string, unknown>) ?? {}

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

// === Save Project (Create or Update) ===
export async function saveProjectAction(input: SaveProjectInput): Promise<ActionResult<{ id: string; slug: string }>> {
    const parsed = saveProjectSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { projectId, name, structureType, visualModel, sections, colors, meta } = parsed.data

    const contentData = { sections, colors: colors ?? {}, meta: meta ?? {} }
    const slug = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`

    if (projectId) {
        // UPDATE
        const { data, error } = await supabase.from('projects').update({
            name,
            structure_type: structureType,
            visual_model: visualModel,
            content_data: contentData,
        }).eq('id', projectId).eq('user_id', user.id).select('slug').single()

        if (error || !data) return { success: false, error: 'Error al actualizar el proyecto' }
        revalidatePath('/dashboard')
        return { success: true, data: { id: projectId, slug: data.slug } }
    } else {
        // CREATE
        const { data, error } = await supabase.from('projects').insert({
            slug,
            name,
            structure_type: structureType,
            visual_model: visualModel,
            content_data: contentData,
            user_id: user.id,
        }).select('id, slug').single()

        if (error || !data) return { success: false, error: 'Error al crear el proyecto' }
        revalidatePath('/dashboard')
        return { success: true, data: { id: data.id, slug: data.slug } }
    }
}

// === Fetch Brand Identity (for default colors) ===
export async function fetchBrandColorsAction(): Promise<Record<string, string>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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

// === Publish Project (Save + Compile HTML) ===
export async function publishProjectAction(input: SaveProjectInput): Promise<ActionResult<{ id: string; slug: string }>> {
    const parsed = saveProjectSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { projectId, name, structureType, visualModel, sections, colors, meta } = parsed.data

    const contentData = { sections, colors: colors ?? {}, meta: meta ?? {} }
    const slug = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`

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
        const { data, error } = await supabase.from('projects').update({
            name,
            structure_type: structureType,
            visual_model: visualModel,
            content_data: contentData,
            html_output: htmlOutput,
        }).eq('id', projectId).eq('user_id', user.id).select('slug').single()

        if (error || !data) return { success: false, error: 'Error al publicar el proyecto' }
        revalidatePath('/dashboard')
        revalidatePath(`/p/${data.slug}`)
        return { success: true, data: { id: projectId, slug: data.slug } }
    } else {
        // For new projects, compile again with the real project ID
        const { data, error } = await supabase.from('projects').insert({
            slug,
            name,
            structure_type: structureType,
            visual_model: visualModel,
            content_data: contentData,
            html_output: htmlOutput,
            user_id: user.id,
        }).select('id, slug').single()

        if (error || !data) return { success: false, error: 'Error al crear y publicar el proyecto' }

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
        await supabase.from('projects').update({ html_output: finalHtml })
            .eq('id', data.id).eq('user_id', user.id)

        revalidatePath('/dashboard')
        return { success: true, data: { id: data.id, slug: data.slug } }
    }
}

// === Delete Project ===
export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase.from('projects').delete()
        .eq('id', projectId).eq('user_id', user.id)

    if (error) return { success: false, error: 'Error al eliminar el proyecto' }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

// === Upload Project Image ===
export async function uploadProjectImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
    try {
        const file = formData.get('file') as File | null
        if (!file) return { success: false, error: 'No se recibió archivo.' }

        if (file.size > 5 * 1024 * 1024) return { success: false, error: 'La imagen no puede pesar más de 5MB.' }
        if (!file.type.startsWith('image/')) return { success: false, error: 'El archivo debe ser una imagen válida.' }

        // Auth check with user client
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // Upload with service client (bypasses RLS — bucket policies may not be applied yet)
        const admin = createServiceClient()
        const ext = file.name.split('.').pop() || 'jpg'
        const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

        const { error } = await admin.storage
            .from('project-images')
            .upload(filename, file, { upsert: true })

        if (error) {
            console.error('Storage upload error:', error)
            return { success: false, error: 'Error subiendo la imagen.' }
        }

        const { data: publicUrlData } = admin.storage
            .from('project-images')
            .getPublicUrl(filename)

        return { success: true, data: { url: publicUrlData.publicUrl } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
