// =============================================
// Streaming Political Analysis — API Route
// =============================================
// Streams Gemini analysis text in real-time via Vercel AI SDK.
// Client connects via useChat() or fetch with ReadableStream.

import { aiStreamText } from '@/lib/ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { logger } from '@/shared/lib/logger'
import { NextRequest } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Rate limit
        const rl = await rateLimitAsync(`stream-analysis:${user.id}`, {
            limit: 10,
            windowSec: 3600,
        })
        if (!rl.allowed) {
            return new Response('Rate limit exceeded', { status: 429 })
        }

        const { prompt, system } = await req.json()
        if (!prompt || typeof prompt !== 'string') {
            return new Response('Missing prompt', { status: 400 })
        }

        const result = aiStreamText([{ role: 'user', content: prompt }], {
            system:
                system ??
                'Eres un consultor de inteligencia política de élite. Responde siempre en español.',
            noCensura: true,
            maxTokens: 8000,
            temperature: 0.7,
        })

        return result.toTextStreamResponse()
    } catch (err) {
        logger.error('stream-analysis', 'Streaming analysis failed', err)
        return new Response('Internal Server Error', { status: 500 })
    }
}
