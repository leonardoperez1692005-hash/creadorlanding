import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'

export async function GET() {
    try {
        // Auth check
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const rl = await rateLimitAsync(`intel-dashboard:${user.id}`, { limit: 30, windowSec: 60 })
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const { data: dashboard } = await supabase
            .from('political_intel_reports')
            .select('html_content')
            .eq('report_type', 'dashboard')
            .order('report_date', { ascending: false })
            .limit(1)
            .single()

        if (!dashboard?.html_content) {
            return new NextResponse(
                '<h1>No hay dashboard generado</h1><p>Genera un reporte desde la sección de Inteligencia.</p>',
                { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
            )
        }

        return new NextResponse(dashboard.html_content, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    } catch {
        return new NextResponse('<h1>Error</h1><p>No se pudo cargar el dashboard.</p>', {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    }
}
