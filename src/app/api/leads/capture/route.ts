import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'

// Service role: public endpoint, no user session
const supabaseAdmin = createServiceClient()

const leadSchema = z.object({
    projectId: z.string().uuid('projectId inválido'),
    name: z.string().max(200).default(''),
    email: z.string().email('Email inválido').max(320),
    phone: z.string().max(30).default(''),
    source: z.string().max(200).default(''),
    message: z.string().max(2000).default(''),
})

function getCorsHeaders(origin?: string | null) {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
}

export async function OPTIONS(req: NextRequest) {
    const cors = getCorsHeaders(req.headers.get('origin'))
    return new NextResponse(null, { status: 204, headers: cors })
}

export async function POST(req: NextRequest) {
    const cors = getCorsHeaders(req.headers.get('origin'))

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = await rateLimitAsync(`leads-capture:${ip}`, { limit: 20, windowSec: 60 })
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: cors })
    }

    try {
        const raw = await req.json().catch(() => ({}))
        const parsed = leadSchema.safeParse(raw)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400, headers: cors },
            )
        }

        const { projectId, name, email, phone, source, message } = parsed.data

        // Validate project exists
        const { data: project } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .single()

        if (!project) {
            return NextResponse.json(
                { error: 'Proyecto no encontrado' },
                { status: 404, headers: cors },
            )
        }

        // Rate limit: block same email + project within 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data: existing } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('project_id', projectId)
            .eq('email', email.trim().toLowerCase())
            .gte('created_at', fiveMinutesAgo)
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { error: 'Recibimos tu solicitud hace poco. Por favor, esperá unos minutos.' },
                { status: 429, headers: cors },
            )
        }

        const { data: lead, error } = await supabaseAdmin
            .from('leads')
            .insert({
                project_id: projectId,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                message: message.trim(),
                source: source.trim(),
            })
            .select('id')
            .single()

        if (error) throw error

        return NextResponse.json(
            { message: 'Lead capturado', leadId: lead.id },
            { status: 201, headers: cors },
        )
    } catch {
        return NextResponse.json({ error: 'Error al guardar lead' }, { status: 500, headers: cors })
    }
}
