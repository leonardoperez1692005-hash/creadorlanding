// =============================================
// BrandVortix — AI Provider Abstraction
// =============================================
// Switch between Gemini and Claude via AI_PROVIDER env var.
// Default: gemini (backward-compatible)

export interface AIOptions {
    model?: string
    maxTokens?: number
    temperature?: number
    retries?: number
}

export type AIProvider = 'gemini' | 'claude'

/**
 * Get the active AI provider from environment.
 * Defaults to 'gemini' for backward compatibility.
 */
export function getAIProvider(): AIProvider {
    const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase()
    if (provider === 'claude') return 'claude'
    return 'gemini'
}

/**
 * Call the active AI provider with a prompt.
 * Returns raw text response (usually JSON).
 */
export async function callAI(prompt: string, options?: AIOptions): Promise<string> {
    const provider = getAIProvider()

    if (provider === 'claude') {
        const { callClaude } = await import('./claude')
        return callClaude(prompt, options)
    }

    // Default: Gemini
    const { callGemini } = await import('../gemini')
    return callGemini(prompt, options)
}
