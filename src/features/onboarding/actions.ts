'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/shared/lib/logger'

const onboardingSchema = z.object({
    brand_name: z.string().min(2, 'El nombre de la marca es requerido'),
    sector: z.string().min(2, 'El sector/nicho es requerido'),
    target_audience: z.string().min(10, 'Describe mejor a tu público objetivo'),
    brand_values: z.string().min(5, 'Los valores son requeridos'),
    business_objective: z.string().min(5, 'El objetivo comercial es requerido'),
    logo_url: z.string().optional(),
    colors: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
        background: z.string(),
    }),
    typography: z.object({
        headings: z.string(),
        body: z.string(),
    }),
    geometry: z
        .object({
            radius: z.string(),
            neon_glow: z.boolean(),
            cardStyle: z.enum(['flat', 'glass', 'bordered', 'elevated']).default('flat'),
            backgroundPreset: z.string().default(''),
        })
        .optional(),
})

export type OnboardingData = z.infer<typeof onboardingSchema>

/** Guarda la identidad de marca completa del onboarding (upsert por user_id con design_tokens). */
export async function submitOnboardingAction(data: OnboardingData) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // Valida datos
        const parsed = onboardingSchema.safeParse(data)
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
        }

        // Upsert en brand_identities
        const { error } = await supabase.from('brand_identities').upsert(
            {
                user_id: user.id,
                brand_name: parsed.data.brand_name,
                sector: parsed.data.sector,
                target_audience: parsed.data.target_audience,
                brand_values: parsed.data.brand_values,
                business_objective: parsed.data.business_objective,
                logo_url: parsed.data.logo_url,
                colors: parsed.data.colors,
                typography: parsed.data.typography,
                geometry: parsed.data.geometry,
                design_tokens: {
                    colors: parsed.data.colors,
                    typography: {
                        headingFont: parsed.data.typography.headings,
                        bodyFont: parsed.data.typography.body,
                    },
                    borderRadius: parsed.data.geometry?.radius || '8px',
                    cardStyle: parsed.data.geometry?.cardStyle || 'flat',
                    backgroundPreset: parsed.data.geometry?.backgroundPreset || '',
                },
                is_completed: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
        )

        if (error) {
            logger.error('onboarding', 'Error saving onboarding data', error)
            return { success: false, error: 'Error guardando perfil de marca' }
        }

        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

/** Obtiene la identidad de marca del usuario (null si no completó el onboarding). */
export async function getBrandIdentityAction() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // not found is ok
            logger.error('onboarding', 'Error fetching brand identity', error)
            return { success: false, error: 'Error obteniendo perfil de marca' }
        }

        return { success: true, data: data || null }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// BUSINESS DATA (services, FAQ, testimonials, stats, team, differentiators)
// ================================

const businessItemSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    question: z.string().optional(),
    answer: z.string().optional(),
    text: z.string().optional(),
    author: z.string().optional(),
    value: z.string().optional(),
    label: z.string().optional(),
    name: z.string().optional(),
    role: z.string().optional(),
})

const businessDataSchema = z.object({
    services: z.array(businessItemSchema).default([]),
    faqs: z.array(businessItemSchema).default([]),
    testimonials: z.array(businessItemSchema).default([]),
    stats: z.array(businessItemSchema).default([]),
    team_members: z.array(businessItemSchema).default([]),
    differentiators: z.string().default(''),
})

export type BusinessData = z.infer<typeof businessDataSchema>

/** Guarda los datos de negocio (servicios, FAQ, testimonios, stats, equipo, diferenciadores). */
export async function saveBusinessDataAction(data: BusinessData) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const parsed = businessDataSchema.safeParse(data)
        if (!parsed.success)
            return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }

        const { error } = await supabase
            .from('brand_identities')
            .update({
                services: parsed.data.services,
                faqs: parsed.data.faqs,
                testimonials: parsed.data.testimonials,
                stats: parsed.data.stats,
                team_members: parsed.data.team_members,
                differentiators: parsed.data.differentiators,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)

        if (error) {
            logger.error('onboarding', 'Error saving business data', error)
            return { success: false, error: 'Error guardando datos de negocio' }
        }

        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

/** Obtiene los datos de negocio del usuario (servicios, FAQ, testimonios, stats, equipo). */
export async function getBusinessDataAction() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('brand_identities')
            .select('services, faqs, testimonials, stats, team_members, differentiators')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            return { success: false, error: 'Error obteniendo datos de negocio' }
        }

        return {
            success: true,
            data: data
                ? {
                      services: (data.services ?? []) as BusinessData['services'],
                      faqs: (data.faqs ?? []) as BusinessData['faqs'],
                      testimonials: (data.testimonials ?? []) as BusinessData['testimonials'],
                      stats: (data.stats ?? []) as BusinessData['stats'],
                      team_members: (data.team_members ?? []) as BusinessData['team_members'],
                      differentiators: (data.differentiators ?? '') as string,
                  }
                : null,
        }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

/** Sube el logo de la marca a Storage (valida tipo por magic bytes, máx 5MB). */
export async function uploadLogoAction(formData: FormData) {
    try {
        const file = formData.get('file') as File | null
        if (!file) return { success: false, error: 'No se subió archivo.' }

        // 1. Validate size
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize)
            return { success: false, error: 'El logo no puede pesar más de 5MB.' }

        // 2. Validate file type via magic bytes (not MIME — MIME is spoofable)
        const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
        const isPNG =
            header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47
        const isJPEG = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
        const isWebP =
            header[0] === 0x52 &&
            header[1] === 0x49 &&
            header[2] === 0x46 &&
            header[3] === 0x46 &&
            header[8] === 0x57 &&
            header[9] === 0x45 &&
            header[10] === 0x42 &&
            header[11] === 0x50
        const isGIF = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46
        const isICO =
            header[0] === 0x00 && header[1] === 0x00 && (header[2] === 0x01 || header[2] === 0x02)
        if (!isPNG && !isJPEG && !isWebP && !isGIF && !isICO) {
            return { success: false, error: 'Formato no soportado. Usá PNG, JPG, WebP o GIF.' }
        }

        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // Generate safe unique filename
        const ext = file.name.split('.').pop()
        const filename = `${user.id}-${Date.now()}.${ext}`

        const { error } = await supabase.storage
            .from('brand-logos')
            .upload(filename, file, { upsert: true })

        if (error) {
            logger.error('onboarding', 'Storage upload error', error)
            return { success: false, error: 'Falló la subida del logo al storage.' }
        }

        const { data: publicUrlData } = supabase.storage.from('brand-logos').getPublicUrl(filename)

        return { success: true, url: publicUrlData.publicUrl }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

/** Extrae paleta de colores (primary, secondary, accent) de un logo usando Gemini Vision. */
export async function extractColorsFromLogoAction(logoUrl: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return { success: false, error: 'No Gemini API key supplied' }

        // Usamos la API de google/genai oficial
        const { GoogleGenAI } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey })

        const prompt = `Actúa como un diseñador experto en UI. Analiza este logo y devuelve un objeto JSON estricto con la mejor paleta de colores extraída.
Debe tener exactamente esta estructura con códigos HEX:
{
  "primary": "#...",
  "secondary": "#...",
  "accent": "#..."
}
Constraints:
- "primary": El color dominante de la marca, o el color más prominente y vibrante.
- "secondary": Un color complementario. Si el logo es muy monocromático, provee un tono que lo acompañe bien.
- "accent": Un color brillante que contraste fuertemente, para usar en botones (CTAs).

Devuelve SOLAMENTE el JSON válido en texto plano, sin formato Markdown (sin \`\`\`json) ni explicaciones extras.`

        // Validate URL to prevent SSRF — only allow Supabase storage URLs
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const parsedUrl = new URL(logoUrl)
        const isTrustedHost =
            parsedUrl.hostname.endsWith('.supabase.co') || parsedUrl.origin === supabaseUrl
        if (!isTrustedHost || !['https:', 'http:'].includes(parsedUrl.protocol)) {
            return {
                success: false,
                error: 'URL de imagen no permitida. Solo se aceptan imágenes de Supabase Storage.',
            }
        }

        // Fetch image to pass as inline data
        const imageResp = await fetch(logoUrl)
        if (!imageResp.ok) throw new Error('No se pudo descargar la imagen para analizar')
        const buffer = await imageResp.arrayBuffer()
        const base64Image = Buffer.from(buffer).toString('base64')
        const mimeType = imageResp.headers.get('content-type') || 'image/png'

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [prompt, { inlineData: { data: base64Image, mimeType } }],
        })

        let text = response.text || ''
        text = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()

        try {
            const colors = JSON.parse(text)
            if (!colors.primary || !colors.secondary || !colors.accent) {
                throw new Error('Formato JSON incompleto desde Gemini')
            }
            return { success: true, colors }
        } catch (jsonErr) {
            logger.error('onboarding', 'Failed to parse Gemini color extraction', jsonErr, {
                rawOutput: text.slice(0, 200),
            })
            return {
                success: false,
                error: 'No se pudo leer la paleta de colores. El modelo no devolvió un JSON.',
            }
        }
    } catch (e: unknown) {
        logger.error('onboarding', 'Gemini extraction error', e)
        return { success: false, error: (e as Error).message }
    }
}
