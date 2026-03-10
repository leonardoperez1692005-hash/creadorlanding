// =============================================
// BrandVortix — Claude API Wrapper
// =============================================

import type { AIOptions } from './provider'

const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
}

/**
 * Call Claude API with a prompt and return the raw text response.
 * Requests JSON output via system prompt instruction.
 */
export async function callClaude(prompt: string, options?: AIOptions): Promise<string> {
    const apiKey = process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Missing env var: CLAUDE_API_KEY or ANTHROPIC_API_KEY')

    const model = options?.model ?? DEFAULT_MODEL
    const maxRetries = options?.retries ?? 2

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(CLAUDE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model,
                    max_tokens: options?.maxTokens ?? 4096,
                    temperature: options?.temperature ?? 0.7,
                    system: 'Respond ONLY with valid JSON. No markdown code blocks, no explanations.',
                    messages: [{ role: 'user', content: prompt }],
                }),
            })

            if (!res.ok) {
                const errText = await res.text()
                throw new Error(`Claude API error ${res.status}: ${errText.substring(0, 200)}`)
            }

            const json = await res.json()
            // Extract text from first content block
            const textBlock = json.content?.find((b: { type: string }) => b.type === 'text')
            return textBlock?.text ?? ''
        } catch (err) {
            lastError = err as Error
            if (attempt < maxRetries) {
                await sleep(1000 * Math.pow(2, attempt))
            }
        }
    }

    throw lastError!
}
