'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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
    geometry: z.object({
        radius: z.string(),
        neon_glow: z.boolean(),
    }).optional(),
})

export type OnboardingData = z.infer<typeof onboardingSchema>

export async function submitOnboardingAction(data: OnboardingData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // Valida datos
        const parsed = onboardingSchema.safeParse(data)
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
        }

        // Upsert en brand_identities
        const { error } = await supabase
            .from('brand_identities')
            .upsert({
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
                is_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })

        if (error) {
            console.error('Error saving onboarding data:', error)
            return { success: false, error: 'Error guardando perfil de marca' }
        }

        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function getBrandIdentityAction() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') { // not found is ok
            console.error('Error fetching brand identity:', error)
            return { success: false, error: 'Error obteniendo perfil de marca' }
        }

        return { success: true, data: data || null }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function uploadLogoAction(formData: FormData) {
    try {
        const file = formData.get('file') as File | null;
        if (!file) return { success: false, error: 'No se subió archivo.' };

        // 1. Validate size and type
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) return { success: false, error: 'El logo no puede pesar más de 5MB.' };
        if (!file.type.startsWith('image/')) return { success: false, error: 'El archivo debe ser una imagen válida.' };

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'No autenticado' };

        // Generate safe unique filename
        const ext = file.name.split('.').pop();
        const filename = `${user.id}-${Date.now()}.${ext}`;

        const { data, error } = await supabase.storage
            .from('brand-logos')
            .upload(filename, file, { upsert: true });

        if (error) {
            console.error('Storage upload error:', error);
            return { success: false, error: 'Falló la subida del logo al storage.' };
        }

        const { data: publicUrlData } = supabase.storage
            .from('brand-logos')
            .getPublicUrl(filename);

        return { success: true, url: publicUrlData.publicUrl };
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message };
    }
}

export async function extractColorsFromLogoAction(logoUrl: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return { success: false, error: 'No Gemini API key supplied' };

        // Usamos la API de google/genai oficial
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

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

Devuelve SOLAMENTE el JSON válido en texto plano, sin formato Markdown (sin \`\`\`json) ni explicaciones extras.`;

        // Fetch image to pass as inline data
        const imageResp = await fetch(logoUrl);
        if (!imageResp.ok) throw new Error('No se pudo descargar la imagen para analizar');
        const buffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const mimeType = imageResp.headers.get('content-type') || 'image/png';

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                prompt,
                { inlineData: { data: base64Image, mimeType } }
            ]
        });

        let text = response.text || '';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const colors = JSON.parse(text);
            if (!colors.primary || !colors.secondary || !colors.accent) {
                throw new Error("Formato JSON incompleto desde Gemini");
            }
            return { success: true, colors };
        } catch (jsonErr) {
            console.error("Failed to parse Gemini JSON output:", text);
            return { success: false, error: 'No se pudo leer la paleta de colores. El modelo no devolvió un JSON.' };
        }
    } catch (e: unknown) {
        console.error('Gemini extraction error:', e);
        return { success: false, error: (e as Error).message };
    }
}
