import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { generateExecutiveSummaryHTML } from '@/lib/exports/executiveSummary'
import { logger } from '@/shared/lib/logger'

const summarySchema = z.object({
    brandName: z.string().max(200).optional(),

    strategy: z.any(),

    attackPlan: z.any(),
    generatedAt: z.string().max(100).optional(),
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

        const rl = await rateLimitAsync(`export-summary:${user.id}`, { limit: 10, windowSec: 60 })
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
        }

        const body = await req.json()
        const parsed = summarySchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Datos de entrada inválidos' }, { status: 400 })
        }

        const { brandName, strategy, attackPlan, generatedAt } = parsed.data

        const html = generateExecutiveSummaryHTML({
            brandName: brandName ?? 'Mi Marca',
            strategy,
            attackPlan,
            generatedAt,
        })

        return new NextResponse(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="resumen-ejecutivo-${new Date().toISOString().split('T')[0]}.html"`,
            },
        })
    } catch (err) {
        logger.error('exports', 'Error generando resumen ejecutivo', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Error generando resumen' },
            { status: 500 },
        )
    }
}
