// =============================================
// Test Route — Vercel AI SDK Integration
// =============================================
// Quick validation that the SDK works with all providers.
// GET: returns provider status
// POST: runs a test generation with the active provider

import { aiGenerateText, aiGenerateObject, getModel } from '@/lib/ai/sdk'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/shared/lib/logger'

export const maxDuration = 30

const testSchema = z.object({
    greeting: z.string(),
    provider: z.string(),
    capabilities: z.array(z.string()),
    timestamp: z.string(),
})

export async function GET() {
    const status = {
        sdkVersion: 'ai@latest',
        activeProvider: process.env.AI_PROVIDER ?? 'gemini',
        providers: {
            gemini: {
                configured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY),
            },
            claude: {
                configured: !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY),
            },
            openai: {
                configured: !!process.env.OPENAI_API_KEY,
            },
        },
    }

    return NextResponse.json(status)
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const mode = (body.mode as string) ?? 'text'

        if (mode === 'object') {
            // Test generateObject with Zod schema
            const result = await aiGenerateObject(
                'Genera un saludo de prueba. El provider es el que estés usando. Lista 3 capabilities de la IA. El timestamp es la fecha actual ISO.',
                testSchema,
                { temperature: 0.5 },
            )

            return NextResponse.json({
                success: true,
                mode: 'generateObject',
                result,
            })
        }

        // Default: test generateText
        const text = await aiGenerateText(
            'Decí "Hola desde Vercel AI SDK" y mencioná qué modelo sos. Responde en 1 oración.',
            { temperature: 0.3 },
        )

        return NextResponse.json({
            success: true,
            mode: 'generateText',
            text,
        })
    } catch (err) {
        logger.error('test-ai-sdk', 'Test generation failed', err)
        return NextResponse.json(
            {
                success: false,
                error: 'Error en test AI SDK',
            },
            { status: 500 },
        )
    }
}
