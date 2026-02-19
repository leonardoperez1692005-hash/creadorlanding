/**
 * Gemini AI Service - Generación de estrategia y contenido
 * Modelo: gemini-2.5-flash-preview-09-2025
 */

const GEMINI_MODEL = 'gemini-2.0-flash-001';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_RETRIES = 3;

/**
 * Genera contenido usando Gemini con retry logic
 * @param {string} prompt - El prompt para enviar a Gemini
 * @param {object} [jsonSchema] - Schema JSON opcional para respuestas estructuradas
 * @returns {Promise<object|string>} Respuesta parseada
 */
export async function generateWithGemini(prompt, jsonSchema = null) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY no configurada en .env');
    }

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
        },
    };

    // Si se proporciona un JSON schema, forzar respuesta estructurada
    if (jsonSchema) {
        requestBody.generationConfig.responseMimeType = 'application/json';
        requestBody.generationConfig.responseSchema = jsonSchema;
    }

    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Gemini API error (${response.status}): ${errorData}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('Gemini no retornó contenido');
            }

            // Intentar parsear como JSON si se esperaba
            if (jsonSchema) {
                try {
                    return JSON.parse(text);
                } catch {
                    // Si falla el parse, intentar extraer JSON del texto
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                    return text;
                }
            }

            return text;
        } catch (error) {
            lastError = error;
            console.error(`[Gemini] Intento ${attempt}/${MAX_RETRIES} falló:`, error.message);

            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(`Gemini falló tras ${MAX_RETRIES} intentos: ${lastError.message}`);
}
