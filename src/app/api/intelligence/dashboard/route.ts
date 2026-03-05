import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const dir = resolve(process.cwd(), 'output/political-intel')
        const files = readdirSync(dir)
            .filter(f => f.startsWith('dashboard-') && f.endsWith('.html'))
            .sort()

        const latest = files.at(-1)
        if (!latest) {
            return new NextResponse(
                '<h1>No hay dashboard generado</h1><p>Ejecuta: <code>npx tsx scripts/political-intel.ts</code></p>',
                { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
            )
        }

        const html = readFileSync(resolve(dir, latest), 'utf-8')
        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    } catch {
        return new NextResponse(
            '<h1>Error</h1><p>No se encontró el directorio output/political-intel/</p>',
            { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        )
    }
}
