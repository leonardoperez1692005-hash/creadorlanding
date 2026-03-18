import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('name, html_output')
        .eq('slug', slug)
        .single()

    if (error || !data) {
        return new NextResponse(
            '<!DOCTYPE html><html><head><title>No encontrado</title></head><body><h1>Página no encontrada</h1></body></html>',
            { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        )
    }

    if (!data.html_output) {
        return new NextResponse(
            `<!DOCTYPE html><html><head><title>${data.name}</title></head><body><h1>Esta landing aún no fue publicada</h1><p>Publicala desde el wizard para verla aquí.</p></body></html>`,
            { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        )
    }

    return new NextResponse(data.html_output, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            'X-Robots-Tag': 'index, follow',
            'Content-Language': 'es',
        },
    })
}
