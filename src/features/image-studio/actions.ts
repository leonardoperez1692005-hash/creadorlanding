'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserPermissions, hasReachedLimit } from '@/lib/permissions'
import { logger } from '@/shared/lib/logger'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { generateImage } from '@/lib/ai/imageGenerator'
import { generateImageInputSchema, brandStyleInputSchema, imageFiltersSchema } from './schemas'
import type { ActionResult, BrandImageStyle, GeneratedImage, ImageHistoryItem } from './types'
import { loadCampaignBrain, buildBrainCompactContext } from '@/features/political-intel/brain'

const FEATURE = 'image-studio'

// ─── Helper: get authenticated user ────────────────────

async function getUser() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    return { supabase, user }
}

// ─── 1. Generate Image ─────────────────────────────────

/** Genera una imagen con IA (OpenAI gpt-image-1), la sube a Storage y guarda el registro. */
export async function generateImageAction(input: unknown): Promise<ActionResult<GeneratedImage>> {
    try {
        const { supabase, user } = await getUser()
        const serviceClient = createServiceClient()

        // Validate input
        const parsed = generateImageInputSchema.safeParse(input)
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Input inválido' }
        }

        const { prompt, platform, size, quality, postReference, tags } = parsed.data

        // Enforce image generation limit
        const perms = await getUserPermissions(user.id)
        if (hasReachedLimit(perms, 'images')) {
            return {
                success: false,
                error: `Límite de imágenes alcanzado (${perms.limits.maxImages}). Contactá al administrador para ampliar tu plan.`,
            }
        }

        // Rate limit: 10 images per hour
        const rl = await rateLimitAsync(`img-gen:${user.id}`, { limit: 10, windowSec: 3600 })
        if (!rl.allowed) {
            return {
                success: false,
                error: `Límite alcanzado (10 imágenes/hora). Intentá en ${Math.ceil((rl.resetAt - Date.now()) / 60000)} minutos.`,
            }
        }

        // Enrich prompt with campaign brain context (colors, style, tone)
        const brain = await loadCampaignBrain(supabase, user.id)
        const brainContext = brain.campaign ? buildBrainCompactContext(brain) : ''
        const enrichedPrompt = brainContext
            ? `${brainContext}\n\nImagen solicitada: ${prompt}`
            : prompt

        // Generate image via OpenAI
        const result = await generateImage(enrichedPrompt, size, quality)

        // Upload to Supabase Storage
        const timestamp = Date.now()
        const storagePath = `images/${user.id}/${timestamp}.png`
        const imageBuffer = Buffer.from(result.b64Data, 'base64')

        const { error: uploadError } = await serviceClient.storage
            .from('generated-images')
            .upload(storagePath, imageBuffer, {
                contentType: 'image/png',
                upsert: false,
            })

        if (uploadError) {
            logger.error(FEATURE, 'Storage upload failed', uploadError)
            return { success: false, error: `Error subiendo imagen: ${uploadError.message}` }
        }

        const { data: publicUrlData } = serviceClient.storage
            .from('generated-images')
            .getPublicUrl(storagePath)

        // Save record to DB
        const { data: record, error: dbError } = await serviceClient
            .from('generated_images')
            .insert({
                user_id: user.id,
                storage_url: publicUrlData.publicUrl,
                storage_path: storagePath,
                prompt,
                revised_prompt: result.revisedPrompt,
                platform,
                size,
                quality,
                post_reference: postReference ?? null,
                tags: tags ?? [],
                is_favorite: false,
            })
            .select('*')
            .single()

        if (dbError) {
            logger.error(FEATURE, 'DB insert failed', dbError)
            return { success: false, error: 'Error guardando registro de imagen' }
        }

        logger.info(FEATURE, 'Image generated and saved', {
            imageId: record.id,
            platform,
            size,
        })

        return {
            success: true,
            data: mapGeneratedImage(record),
        }
    } catch (e) {
        logger.error(FEATURE, 'generateImageAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── 2. Save Brand Style ───────────────────────────────

/** Guarda o actualiza el estilo visual de marca para generación de imágenes (upsert por user_id). */
export async function saveBrandStyleAction(input: unknown): Promise<ActionResult<{ id: string }>> {
    try {
        const { user } = await getUser()
        const serviceClient = createServiceClient()

        const parsed = brandStyleInputSchema.safeParse(input)
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Input inválido' }
        }

        const d = parsed.data

        const { data, error } = await serviceClient
            .from('brand_image_styles')
            .upsert(
                {
                    user_id: user.id,
                    color_palette: d.colorPalette,
                    style_keywords: d.styleKeywords,
                    mood_descriptors: d.moodDescriptors,
                    avoid_keywords: d.avoidKeywords,
                    brand_name: d.brandName,
                    industry: d.industry,
                    visual_references: d.visualReferences,
                    preferred_font_style: d.preferredFontStyle,
                    background_style: d.backgroundStyle,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            )
            .select('id')
            .single()

        if (error) {
            logger.error(FEATURE, 'saveBrandStyle failed', error)
            return { success: false, error: 'Error guardando estilo de marca' }
        }

        logger.info(FEATURE, 'Brand style saved', { styleId: data.id })
        return { success: true, data: { id: data.id } }
    } catch (e) {
        logger.error(FEATURE, 'saveBrandStyleAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── 3. Load Brand Style ───────────────────────────────

/** Carga el estilo visual de marca del usuario (puede ser null si no existe). */
export async function loadBrandStyleAction(): Promise<ActionResult<BrandImageStyle | null>> {
    try {
        const { user } = await getUser()
        const serviceClient = createServiceClient()

        const { data, error } = await serviceClient
            .from('brand_image_styles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

        if (error) {
            logger.error(FEATURE, 'loadBrandStyle failed', error)
            return { success: false, error: 'Error cargando estilo de marca' }
        }

        if (!data) {
            return { success: true, data: null }
        }

        return { success: true, data: mapBrandStyle(data) }
    } catch (e) {
        logger.error(FEATURE, 'loadBrandStyleAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── 4. List Images ────────────────────────────────────

/** Lista imágenes generadas del usuario con filtros opcionales (plataforma, favoritos). */
export async function listImagesAction(
    filters?: unknown,
): Promise<ActionResult<ImageHistoryItem[]>> {
    try {
        const { user } = await getUser()
        const serviceClient = createServiceClient()

        const parsed = imageFiltersSchema.safeParse(filters ?? {})
        const f = parsed.success ? parsed.data : {}

        let query = serviceClient
            .from('generated_images')
            .select('id, platform, prompt, storage_url, tags, is_favorite, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(f.limit ?? 50)

        if (f.platform) {
            query = query.eq('platform', f.platform)
        }
        if (f.favoritesOnly) {
            query = query.eq('is_favorite', true)
        }

        const { data, error } = await query

        if (error) {
            logger.error(FEATURE, 'listImages failed', error)
            return { success: false, error: 'Error listando imágenes' }
        }

        return {
            success: true,
            /* eslint-disable @typescript-eslint/no-explicit-any */
            data: ((data ?? []) as any[]).map(
                (row): ImageHistoryItem => ({
                    id: row.id,
                    platform: row.platform,
                    prompt: row.prompt,
                    storageUrl: row.storage_url,
                    tags: (row.tags as string[]) ?? [],
                    isFavorite: row.is_favorite,
                    createdAt: row.created_at,
                }),
            ),
            /* eslint-enable @typescript-eslint/no-explicit-any */
        }
    } catch (e) {
        logger.error(FEATURE, 'listImagesAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── 5. Delete Image ───────────────────────────────────

/** Elimina una imagen generada de Storage y de la base de datos. */
export async function deleteImageAction(imageId: string): Promise<ActionResult<undefined>> {
    try {
        const { user } = await getUser()
        const serviceClient = createServiceClient()

        // Get storage path first
        const { data: img, error: fetchError } = await serviceClient
            .from('generated_images')
            .select('storage_path')
            .eq('id', imageId)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !img) {
            return { success: false, error: 'Imagen no encontrada' }
        }

        // Delete from Storage
        await serviceClient.storage.from('generated-images').remove([img.storage_path])

        // Delete from DB
        const { error: deleteError } = await serviceClient
            .from('generated_images')
            .delete()
            .eq('id', imageId)
            .eq('user_id', user.id)

        if (deleteError) {
            logger.error(FEATURE, 'deleteImage DB failed', deleteError)
            return { success: false, error: 'Error eliminando registro' }
        }

        logger.info(FEATURE, 'Image deleted', { imageId })
        return { success: true, data: undefined }
    } catch (e) {
        logger.error(FEATURE, 'deleteImageAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── 6. Toggle Favorite ────────────────────────────────

/** Alterna el estado de favorito de una imagen generada. */
export async function toggleFavoriteAction(
    imageId: string,
): Promise<ActionResult<{ isFavorite: boolean }>> {
    try {
        const { user } = await getUser()
        const serviceClient = createServiceClient()

        // Get current value
        const { data: img, error: fetchError } = await serviceClient
            .from('generated_images')
            .select('is_favorite')
            .eq('id', imageId)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !img) {
            return { success: false, error: 'Imagen no encontrada' }
        }

        const newValue = !img.is_favorite

        const { error: updateError } = await serviceClient
            .from('generated_images')
            .update({ is_favorite: newValue })
            .eq('id', imageId)
            .eq('user_id', user.id)

        if (updateError) {
            logger.error(FEATURE, 'toggleFavorite failed', updateError)
            return { success: false, error: 'Error actualizando favorito' }
        }

        return { success: true, data: { isFavorite: newValue } }
    } catch (e) {
        logger.error(FEATURE, 'toggleFavoriteAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── 7. Suggest Enhanced Prompt ────────────────────────

/** Sugiere un prompt mejorado para generación de imágenes usando Gemini. */
export async function suggestPromptAction(input: {
    basePrompt: string
    postText?: string
    platform?: string
}): Promise<ActionResult<{ prompt: string }>> {
    try {
        const { supabase, user } = await getUser()

        // Rate limit: 20 suggestions per hour
        const rl = await rateLimitAsync(`img-suggest:${user.id}`, { limit: 20, windowSec: 3600 })
        if (!rl.allowed) {
            return { success: false, error: 'Límite de sugerencias alcanzado. Intentá más tarde.' }
        }

        const { callGemini } = await import('@/lib/gemini')

        // Load brain for campaign style context
        const brain = await loadCampaignBrain(supabase, user.id)
        const brainHint = brain.campaign ? buildBrainCompactContext(brain) : ''

        const systemPrompt = `Sos un experto en prompts para generación de imágenes con IA.
Dado el siguiente prompt base y contexto, mejoralo para obtener una imagen de alta calidad.
Mantené la intención original pero agregá detalles visuales, estilo, composición y técnica.
${brainHint ? `Contexto de campaña (usá colores y estilo si aplica): ${brainHint}` : ''}
Respondé SOLO con el prompt mejorado, sin explicaciones. Máximo 500 caracteres.`

        const userMsg = [
            `Prompt base: ${input.basePrompt}`,
            input.postText ? `Contexto del post: ${input.postText}` : '',
            input.platform ? `Plataforma: ${input.platform}` : '',
        ]
            .filter(Boolean)
            .join('\n')

        const result = await callGemini(`${systemPrompt}\n\n${userMsg}`, {
            maxTokens: 300,
            temperature: 0.7,
        })

        const enhanced = result.trim().replace(/^["']|["']$/g, '')

        logger.info(FEATURE, 'Prompt suggestion generated', {
            originalLength: input.basePrompt.length,
            enhancedLength: enhanced.length,
        })

        return { success: true, data: { prompt: enhanced } }
    } catch (e) {
        logger.error(FEATURE, 'suggestPromptAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── Mappers ───────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapGeneratedImage(row: any): GeneratedImage {
    return {
        id: row.id,
        userId: row.user_id,
        storageUrl: row.storage_url,
        storagePath: row.storage_path,
        prompt: row.prompt,
        revisedPrompt: row.revised_prompt,
        platform: row.platform,
        size: row.size,
        quality: row.quality,
        postReference: row.post_reference,
        brandStyleId: row.brand_style_id,
        tags: (row.tags as string[]) ?? [],
        isFavorite: row.is_favorite,
        createdAt: row.created_at,
    }
}

function mapBrandStyle(row: any): BrandImageStyle {
    return {
        id: row.id,
        userId: row.user_id,
        colorPalette: (row.color_palette as string[]) ?? [],
        styleKeywords: (row.style_keywords as string[]) ?? [],
        moodDescriptors: (row.mood_descriptors as string[]) ?? [],
        avoidKeywords: (row.avoid_keywords as string[]) ?? [],
        brandName: row.brand_name ?? '',
        industry: row.industry ?? '',
        visualReferences: row.visual_references ?? '',
        preferredFontStyle: row.preferred_font_style ?? 'sans-serif',
        backgroundStyle: row.background_style ?? 'minimal',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
