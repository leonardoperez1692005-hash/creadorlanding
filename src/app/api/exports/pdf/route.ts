import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import {
    generateAttackPlanPDF,
    generateIntelReportPDF,
    generatePoliticalReportPDF,
    generateStrategyPDF,
    generateLeadsPDF,
} from '@/lib/exports/pdf/pdfGenerator'
import { logger } from '@/shared/lib/logger'

const exportSchema = z.object({
    type: z.string().max(50),

    data: z.any(),
})

export const maxDuration = 30

export async function POST(req: NextRequest) {
    try {
        // Auth
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Rate limit: 10 exports per minute
        const rl = await rateLimitAsync(`export-pdf:${user.id}`, { limit: 10, windowSec: 60 })
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
        }

        const body = await req.json()
        const parsed = exportSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Datos de entrada inválidos' }, { status: 400 })
        }

        const { type, data } = parsed.data

        let buffer: Buffer

        switch (type) {
            case 'attack-plan':
                buffer = await generateAttackPlanPDF(data.plan, data.meta)
                break
            case 'intel-report':
                buffer = await generateIntelReportPDF(data)
                break
            case 'political':
                buffer = await generatePoliticalReportPDF(data)
                break
            case 'strategy':
                buffer = await generateStrategyPDF(data.strategy, data.meta)
                break
            case 'leads':
                buffer = await generateLeadsPDF(data.leads, data.projectName)
                break
            default:
                return NextResponse.json({ error: `Tipo no soportado: ${type}` }, { status: 400 })
        }

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.pdf"`,
            },
        })
    } catch (err) {
        logger.error('exports', 'Error generando PDF', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Error generando PDF' },
            { status: 500 },
        )
    }
}
