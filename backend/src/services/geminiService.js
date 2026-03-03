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

/**
 * Genera el prompt de copywriting para Landing Page basado en estrategia ZentrixOs
 * @param {object} strategyData - Estrategia completa (competitorAnalysis, marketInsights, salesAngles, etc.)
 * @param {string} templateType - Tipo de template: 'vsl' | 'webinar' | 'long_letter'
 * @returns {string} Prompt formateado para Gemini
 */
export function buildLandingContentPrompt(strategyData, templateType) {
    const sectionSchemas = {
        vsl: `{
  "hero": {
    "headline": "Titular que ataca el dolor principal del mercado (max 12 palabras)",
    "subheadline": "Subtitulo que amplifica la urgencia y promete transformacion (1-2 oraciones)"
  },
  "benefits": {
    "title": "Titulo de seccion de beneficios",
    "items": [
      { "title": "Beneficio 1 (3-5 palabras)", "description": "Explicacion concreta de por que este beneficio importa (1-2 oraciones)" },
      { "title": "Beneficio 2", "description": "..." },
      { "title": "Beneficio 3", "description": "..." },
      { "title": "Beneficio 4", "description": "..." }
    ]
  },
  "urgency": {
    "text": "Texto de urgencia con escasez real y razon creible para actuar ahora"
  },
  "countdown": {
    "headline": "Texto persuasivo sobre la cuenta regresiva"
  },
  "offer": {
    "title": "Titulo de la oferta irresistible",
    "cta_text": "Texto del boton de accion (verbo + beneficio)",
    "features": ["Lo que incluye 1", "Lo que incluye 2", "Lo que incluye 3", "Lo que incluye 4", "Lo que incluye 5"]
  },
  "lead_capture": {
    "headline": "Titulo del formulario que promete valor a cambio",
    "subheadline": "Subtitulo que reduce friccion y genera confianza",
    "cta_text": "Texto del boton de registro (verbo + resultado)"
  },
  "faq": {
    "items": [
      { "question": "Objecion real #1 formulada como pregunta", "answer": "Respuesta que elimina la objecion con evidencia o logica" },
      { "question": "Objecion #2", "answer": "..." },
      { "question": "Objecion #3", "answer": "..." },
      { "question": "Objecion #4", "answer": "..." },
      { "question": "Objecion #5", "answer": "..." }
    ]
  }
}`,
        webinar: `{
  "hero": {
    "headline": "Titular que promete una transformacion especifica al asistir (max 12 palabras)",
    "subheadline": "Subtitulo que posiciona el webinar como oportunidad unica"
  },
  "speaker": {
    "name": "Nombre del presentador o marca",
    "bio": "Bio de 2-3 oraciones que establece autoridad y credibilidad en el sector"
  },
  "learning": {
    "title": "Lo que vas a descubrir en esta sesion",
    "items": [
      "Aprendizaje clave #1 formulado como beneficio concreto",
      "Aprendizaje clave #2",
      "Aprendizaje clave #3",
      "Aprendizaje clave #4"
    ]
  },
  "target": {
    "title": "Esto es para ti si...",
    "items": [
      { "title": "Perfil #1 (3-5 palabras)", "description": "Situacion especifica que identifica al asistente ideal" },
      { "title": "Perfil #2", "description": "..." },
      { "title": "Perfil #3", "description": "..." }
    ]
  },
  "urgency": {
    "text": "Texto de urgencia con plazas limitadas o fecha especifica"
  },
  "countdown": {
    "headline": "Texto persuasivo sobre la cuenta regresiva del evento"
  },
  "offer": {
    "title": "Lo que obtendras al registrarte",
    "cta_text": "Texto del boton de registro",
    "features": ["Beneficio de asistir 1", "Beneficio 2", "Beneficio 3"]
  },
  "lead_capture": {
    "headline": "Titulo del formulario de registro",
    "subheadline": "Subtitulo que genera urgencia por las plazas",
    "cta_text": "RESERVAR MI LUGAR"
  },
  "faq": {
    "items": [
      { "question": "Pregunta frecuente sobre el webinar #1", "answer": "Respuesta clara" },
      { "question": "Pregunta #2", "answer": "..." },
      { "question": "Pregunta #3", "answer": "..." }
    ]
  }
}`,
        long_letter: `{
  "hero": {
    "headline": "Titular emocional que conecta con el dolor profundo del lector (max 15 palabras)",
    "subheadline": "Subtitulo que genera identificacion y curiosidad"
  },
  "story": {
    "text": "Historia de 3-4 parrafos que sigue el framework: Situacion inicial → Problema que empeora → Momento de quiebre → Descubrimiento de la solucion. Escribe en primera persona o tercera persona cercana. Cada parrafo separado por \\n\\n."
  },
  "solution": {
    "title": "Nombre de la solucion presentada como descubrimiento",
    "text": "Descripcion de 2-3 parrafos de como funciona la solucion y por que es diferente a todo lo demas. Conecta con los pain points investigados. Parrafos separados por \\n\\n."
  },
  "benefits": {
    "title": "Lo que vas a lograr",
    "items": [
      { "title": "Resultado concreto #1", "description": "Explicacion detallada del beneficio con prueba o logica" },
      { "title": "Resultado #2", "description": "..." },
      { "title": "Resultado #3", "description": "..." },
      { "title": "Resultado #4", "description": "..." }
    ]
  },
  "testimonials": {
    "items": [
      { "text": "Testimonio realista de un cliente que describe su transformacion (2-3 oraciones)", "author": "Nombre y contexto (ej: Maria G., Emprendedora)" },
      { "text": "Otro testimonio con resultado especifico", "author": "Nombre y contexto" },
      { "text": "Testimonio que ataca una objecion comun", "author": "Nombre y contexto" }
    ]
  },
  "urgency": {
    "text": "Parrafo de urgencia que usa escasez real o consecuencia de no actuar"
  },
  "offer": {
    "title": "Tu inversion en [resultado deseado]",
    "cta_text": "Texto del boton de accion",
    "features": ["Incluye 1", "Incluye 2", "Incluye 3", "Incluye 4", "Incluye 5"]
  },
  "lead_capture": {
    "headline": "Titulo del formulario de contacto",
    "subheadline": "Subtitulo que promete respuesta rapida",
    "cta_text": "Texto del boton",
    "message_placeholder": "Placeholder del campo de mensaje"
  },
  "faq": {
    "items": [
      { "question": "Objecion real #1 como pregunta", "answer": "Respuesta que desarma con evidencia" },
      { "question": "Objecion #2", "answer": "..." },
      { "question": "Objecion #3", "answer": "..." },
      { "question": "Objecion #4", "answer": "..." },
      { "question": "Objecion #5", "answer": "..." }
    ]
  }
}`,
    };

    const templateNames = {
        vsl: 'Video Sales Letter (VSL)',
        webinar: 'Registro a Webinar',
        long_letter: 'Carta de Ventas (Long-Form Sales Letter)',
    };

    return `Eres un copywriter de respuesta directa de clase mundial, especialista en Landing Pages de alta conversion para el mercado hispanohablante.

## TU MISION
Escribe TODO el contenido textual para una Landing Page tipo "${templateNames[templateType] || templateNames.vsl}" usando la estrategia competitiva real que te proporciono abajo. Cada palabra debe estar calculada para convertir visitantes en leads o clientes.

## ESTRATEGIA COMPETITIVA (datos reales de investigacion de mercado)
${JSON.stringify(strategyData, null, 2)}

## FRAMEWORKS DE COPYWRITING OBLIGATORIOS

### Para el HERO:
- Usa el framework PAS: identifica el PROBLEMA principal del publico objetivo, AGITA las consecuencias de no resolverlo, presenta la SOLUCION.
- El headline debe ser especifico al sector y audiencia — nunca generico.
- Incorpora el sales angle mas potente de la estrategia.

### Para BENEFICIOS:
- Cada beneficio debe ser un RESULTADO concreto, no una caracteristica tecnica.
- Usa la formula: "Logra [resultado deseado] sin [obstaculo temido]".
- Basa los beneficios en los pain points reales del mercado investigados.

### Para URGENCIA:
- La urgencia debe sentirse real y justificada, no fabricada.
- Conecta con una consecuencia real de no actuar (basada en pain points del mercado).

### Para OFERTA:
- Presenta lo que incluye como una pila de valor irresistible.
- El CTA debe ser un verbo + resultado, no "Comprar ahora".

### Para FAQ:
- Las preguntas deben ser las OBJECIONES REALES que tendria el publico objetivo.
- Las respuestas deben desarmar cada objecion con logica, evidencia o reencuadre.
- Usa las debilidades de los competidores como contraste implicito (sin nombrarlos directamente).

${templateType === 'long_letter' ? `### Para HISTORIA:
- Cuenta una historia que el lector sienta como propia.
- Sigue la estructura: vida normal → problema que crece → punto de quiebre → descubrimiento.
- Los dolores de la historia deben coincidir con los pain points investigados.

### Para TESTIMONIOS:
- Crea testimonios que suenen reales y especificos (no genericos).
- Cada testimonio debe atacar una objecion diferente.
- Incluye contexto del autor (nombre, rol, situacion).
` : ''}${templateType === 'webinar' ? `### Para SPEAKER:
- La bio debe establecer autoridad instantanea en el sector.
- Menciona resultados concretos, no titulos abstractos.

### Para APRENDIZAJES:
- Cada punto debe ser un micro-resultado que el asistente obtendra.
- Formula como beneficios, no como temas academicos.

### Para PUBLICO OBJETIVO:
- Describe situaciones especificas que hagan al lector decir "eso me pasa a mi".
` : ''}
## REGLAS ESTRICTAS
- Escribe en espanol profesional, directo y persuasivo
- NO uses emojis en ningun texto
- NO uses frases vacias como "solucion integral", "lider en el mercado", "de primer nivel", "revolucionario"
- Cada titular debe ser ESPECIFICO al sector "${strategyData?.marketInsights?.trends?.[0] || 'del cliente'}"
- Los textos largos (story, solution) deben usar \\n\\n para separar parrafos
- NO generes campos que el usuario debe llenar manualmente (video_url, price_current, end_date, cta_url, photo)

## FORMATO DE RESPUESTA
Devuelve un JSON con esta estructura EXACTA (cada key es el ID de una seccion de la landing):
${sectionSchemas[templateType] || sectionSchemas.vsl}

Responde SOLO con el JSON valido, sin delimitadores de codigo markdown. TODO en espanol.`;
}
