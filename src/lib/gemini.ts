// =============================================
// Shared Gemini Client
// =============================================

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-2.0-flash'

function getApiKey(): string {
    const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY no configurada')
    return key
}

export interface GeminiOptions {
    model?: string
    maxTokens?: number
    temperature?: number
}

/**
 * Call Gemini API with a prompt and return the raw text response.
 * Uses JSON response mode by default.
 */
export async function callGemini(
    prompt: string,
    options?: GeminiOptions
): Promise<string> {
    const model = options?.model ?? DEFAULT_MODEL
    const apiKey = getApiKey()

    const res = await fetch(
        `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 4096,
                    responseMimeType: 'application/json',
                },
            }),
        }
    )

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 200)}`)
    }

    const json = await res.json()
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

/**
 * Parse JSON from AI response text.
 * Handles markdown code blocks and extracts the first JSON object.
 */
export function parseJsonFromAI(raw: string): unknown {
    let clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) clean = match[0]
    return JSON.parse(clean)
}
