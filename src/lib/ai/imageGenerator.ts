// =============================================
// OpenAI Images API — gpt-image-1
// Raw fetch (same pattern as whisper.ts)
// =============================================

import { env } from '@/lib/env'
import { logger } from '@/shared/lib/logger'

export interface ImageGenerationResult {
    b64Data: string
    revisedPrompt: string | null
}

interface OpenAIImagesResponse {
    data: Array<{
        b64_json?: string
        revised_prompt?: string
    }>
}

/**
 * Generate an image using OpenAI gpt-image-1.
 *
 * @param prompt - The text prompt describing the image
 * @param size - Image size: '1024x1024' | '1536x1024' | '1024x1536'
 * @param quality - 'low' | 'medium' | 'high'
 * @returns Base64-encoded PNG image data + optional revised prompt
 */
export async function generateImage(
    prompt: string,
    size: '1024x1024' | '1536x1024' | '1024x1536' | '1920x800' = '1024x1024',
    quality: 'low' | 'medium' | 'high' = 'low',
): Promise<ImageGenerationResult> {
    const apiKey = env.openaiApiKey
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
    }

    logger.info('image-studio', 'Generating image with gpt-image-1', {
        size,
        quality,
        promptLength: prompt.length,
    })

    const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-image-1',
            prompt,
            n: 1,
            size,
            quality,
            output_format: 'png',
        }),
    })

    if (res.status === 429) {
        logger.warn('image-studio', 'Rate limited by OpenAI, retrying in 2s')
        await new Promise((r) => setTimeout(r, 2000))
        const retry = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-image-1',
                prompt,
                n: 1,
                size,
                quality,
                output_format: 'png',
            }),
        })
        if (!retry.ok) {
            const errText = await retry.text()
            throw new Error(`OpenAI Images API error ${retry.status}: ${errText.substring(0, 300)}`)
        }
        const data = (await retry.json()) as OpenAIImagesResponse
        return extractResult(data)
    }

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`OpenAI Images API error ${res.status}: ${errText.substring(0, 300)}`)
    }

    const data = (await res.json()) as OpenAIImagesResponse

    return extractResult(data)
}

function extractResult(data: OpenAIImagesResponse): ImageGenerationResult {
    const item = data.data?.[0]
    if (!item?.b64_json) {
        throw new Error('OpenAI returned no image data')
    }

    logger.info('image-studio', 'Image generated successfully', {
        hasRevisedPrompt: !!item.revised_prompt,
    })

    return {
        b64Data: item.b64_json,
        revisedPrompt: item.revised_prompt ?? null,
    }
}
