import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role: public endpoint, no user session
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({})) as Record<string, string>
        const { projectId, name = '', email, phone = '', source = '', message = '' } = body

        if (!projectId || !email) {
            return NextResponse.json(
                { error: 'projectId y email son requeridos' },
                { status: 400, headers: CORS_HEADERS }
            )
        }

        // Validate project exists
        const { data: project } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .single()

        if (!project) {
            return NextResponse.json(
                { error: 'Proyecto no encontrado' },
                { status: 404, headers: CORS_HEADERS }
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
                { status: 429, headers: CORS_HEADERS }
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
            { status: 201, headers: CORS_HEADERS }
        )
    } catch {
        return NextResponse.json(
            { error: 'Error al guardar lead' },
            { status: 500, headers: CORS_HEADERS }
        )
    }
}
