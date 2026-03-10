import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compileWidget } from '@/lib/exports/widgetCompiler'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { logger } from '@/shared/lib/logger'

export async function GET(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = await rateLimitAsync(`widget:${ip}`, { limit: 60, windowSec: 60 })
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    try {
        const slug = req.nextUrl.searchParams.get('slug')
        if (!slug) {
            return NextResponse.json({ error: 'Slug requerido' }, { status: 400 })
        }

        const supabase = await createClient()

        // Find published project by slug
        const { data: project, error } = await supabase
            .from('projects')
            .select('compiled_html')
            .eq('slug', slug)
            .eq('published', true)
            .single()

        if (error || !project?.compiled_html) {
            return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
        }

        const widgetJs = compileWidget(project.compiled_html, {
            containerId: `bv-widget-${slug}`,
        })

        // Return just the inner JS (strip <script> tags)
        const jsContent = widgetJs.replace(/^<script>\n?/, '').replace(/\n?<\/script>$/, '')

        return new NextResponse(jsContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (err) {
        logger.error('exports', 'Error generando widget', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Error generando widget' },
            { status: 500 },
        )
    }
}
