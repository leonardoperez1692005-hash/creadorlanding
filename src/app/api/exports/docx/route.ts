import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import {
    generateAttackPlanDOCX,
    generatePoliticalReportDOCX,
    generateStrategyDOCX,
} from '@/lib/exports/docx/docxGenerator'
import { logger } from '@/shared/lib/logger'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const rl = await rateLimitAsync(`export-docx:${user.id}`, { limit: 10, windowSec: 60 })
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
        }

        const { type, data } = await req.json()

        let buffer: Buffer

        switch (type) {
            case 'attack-plan':
                buffer = await generateAttackPlanDOCX(data.plan, data.meta)
                break
            case 'political':
                buffer = await generatePoliticalReportDOCX(data)
                break
            case 'strategy':
                buffer = await generateStrategyDOCX(data.strategy, data.meta)
                break
            default:
                return NextResponse.json(
                    { error: `DOCX no soportado para tipo: ${type}` },
                    { status: 400 },
                )
        }

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.docx"`,
            },
        })
    } catch (err) {
        logger.error('exports', 'Error generando DOCX', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Error generando DOCX' },
            { status: 500 },
        )
    }
}
