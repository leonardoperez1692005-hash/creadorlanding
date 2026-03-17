import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import {
    generateLeadsXLSX,
    generateSocialCalendarXLSX,
    generateCompetitorMatrixXLSX,
} from '@/lib/exports/xlsx/xlsxGenerator'
import { logger } from '@/shared/lib/logger'

const exportSchema = z.object({
    type: z.string().max(50),

    data: z.any(),
})

export const maxDuration = 30

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const rl = await rateLimitAsync(`export-xlsx:${user.id}`, { limit: 10, windowSec: 60 })
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
            case 'leads':
                buffer = await generateLeadsXLSX(data.leads, data.projectName)
                break
            case 'social-calendar':
                buffer = await generateSocialCalendarXLSX(data)
                break
            case 'competitor-matrix':
                buffer = await generateCompetitorMatrixXLSX(data)
                break
            default:
                return NextResponse.json(
                    { error: `XLSX no soportado para tipo: ${type}` },
                    { status: 400 },
                )
        }

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.xlsx"`,
            },
        })
    } catch (err) {
        logger.error('exports', 'Error generando XLSX', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Error generando XLSX' },
            { status: 500 },
        )
    }
}
