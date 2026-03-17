import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { generateAttackPlanPPTX, generateStrategyPPTX } from '@/lib/exports/pptx/pptxGenerator'
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

        const rl = await rateLimitAsync(`export-pptx:${user.id}`, { limit: 10, windowSec: 60 })
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
                buffer = await generateAttackPlanPPTX(data.plan, data.meta, data.calendar)
                break
            case 'strategy':
                buffer = await generateStrategyPPTX(data.strategy, data.meta)
                break
            default:
                return NextResponse.json(
                    { error: `PPTX no soportado para tipo: ${type}` },
                    { status: 400 },
                )
        }

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.pptx"`,
            },
        })
    } catch (err) {
        logger.error('exports', 'Error generando PPTX', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Error generando PPTX' },
            { status: 500 },
        )
    }
}
