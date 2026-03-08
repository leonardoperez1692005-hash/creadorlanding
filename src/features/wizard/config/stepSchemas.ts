// ─── Step Schemas: Centralized field definitions for every wizard step ─────
//
// Each entry in STEP_SCHEMAS maps a step ID to its rendering configuration.
// The discriminated union allows StepContent to render the right component.

import type { FieldDefinition } from '../types'

// ─── Schema types ─────────────────────────────────────────────

interface StepSchemaGeneric {
    kind: 'generic'
    title: string
    fields?: FieldDefinition[]
    fieldsFn?: (type: string) => FieldDefinition[]
}

interface StepSchemaList {
    kind: 'list'
    title: string
    itemFields: string[]
    headerFields?: string[]
}

interface StepSchemaSimpleList {
    kind: 'simple-list'
    title: string
}

interface StepSchemaSpecial {
    kind: 'special'
    component: 'tracking' | 'review'
}

export type StepSchema =
    | StepSchemaGeneric
    | StepSchemaList
    | StepSchemaSimpleList
    | StepSchemaSpecial

// ─── Reusable schemas (for aliases) ───────────────────────────

const processSchema: StepSchemaList = {
    kind: 'list',
    title: 'Proceso / Cómo Funciona',
    itemFields: ['title', 'description'],
}

// ─── Schema map ───────────────────────────────────────────────

const STEP_SCHEMAS: Record<string, StepSchema> = {
    // ── Header (always present) ──
    header: {
        kind: 'list',
        title: 'Header / Navegación',
        headerFields: ['logo_text', 'logo_image', 'cta_text', 'cta_url'],
        itemFields: ['label', 'url'],
    },

    // ── Core VSL blocks ──
    hero: {
        kind: 'generic',
        title: 'Hero Section',
        fieldsFn: (type) => [
            // ── Campos comunes para TODAS las plantillas ──
            {
                key: 'eyebrow',
                label: 'Eyebrow (texto sobre el título, opcional)',
                type: 'text' as const,
                placeholder: 'Ej: NUEVA FUNCIÓN · ACCESO EXCLUSIVO',
            },
            { key: 'headline', label: 'Título Principal', type: 'text' as const },
            { key: 'subheadline', label: 'Subtítulo', type: 'text' as const },
            {
                key: 'cta_text',
                label: 'Botón Principal — Texto',
                type: 'text' as const,
                placeholder: 'Comenzar Ahora',
            },
            {
                key: 'cta_url',
                label: 'Botón Principal — URL (ancla: #contacto o URL externa)',
                type: 'text' as const,
                placeholder: '#lead_capture o https://...',
            },
            {
                key: 'secondary_cta_text',
                label: 'Botón Secundario — Texto (opcional)',
                type: 'text' as const,
                placeholder: 'Ej: Ver demo',
            },
            {
                key: 'secondary_cta_url',
                label: 'Botón Secundario — URL (ancla: #faq o URL externa)',
                type: 'text' as const,
                placeholder: '#faq o https://...',
            },
            { key: 'bg_image', label: 'Imagen de Fondo', type: 'image' as const },
            { key: 'overlay_color', label: 'Color del Overlay', type: 'color' as const },
            {
                key: 'overlay_opacity',
                label: 'Opacidad Overlay (0–100)',
                type: 'text' as const,
                placeholder: '50',
            },
            // ── Campos específicos por plantilla ──
            ...(type === 'vsl'
                ? [{ key: 'video_url', label: 'URL del Video (YouTube)', type: 'url' as const }]
                : []),
            ...(type === 'webinar'
                ? [{ key: 'date', label: 'Fecha del Evento', type: 'text' as const }]
                : []),
            ...(type === 'long_letter'
                ? [{ key: 'lead', label: 'Lead (párrafo gancho)', type: 'textarea' as const }]
                : []),
        ],
    },
    benefits: { kind: 'list', title: 'Beneficios', itemFields: ['title', 'description'] },
    urgency: {
        kind: 'generic',
        title: 'Banner de Urgencia',
        fields: [
            {
                key: 'title',
                label: 'Título',
                type: 'text',
                placeholder: '⚡ OFERTA POR TIEMPO LIMITADO ⚡',
            },
            {
                key: 'text',
                label: 'Descripción',
                type: 'textarea',
                placeholder: 'Aprovecha antes de que se acabe...',
            },
            { key: 'image', label: 'Imagen', type: 'image' },
            { key: 'bg_image', label: 'Imagen de Fondo', type: 'image' },
            { key: 'bg_color', label: 'Color de Fondo', type: 'color' },
            {
                key: 'cta_text',
                label: 'Texto del Botón',
                type: 'text',
                placeholder: 'Comprar Ahora',
            },
            {
                key: 'cta_url',
                label: 'URL del Botón (#ancla o URL externa)',
                type: 'text',
                placeholder: '#offer o https://...',
            },
        ],
    },
    countdown: {
        kind: 'generic',
        title: 'Contador Regresivo',
        fields: [
            {
                key: 'headline',
                label: 'Texto sobre el contador',
                type: 'text',
                placeholder: 'La oferta expira en:',
            },
            { key: 'end_date', label: 'Fecha de Fin', type: 'datetime-local' },
            { key: 'cta_text', label: 'Texto del Botón', type: 'text' },
            {
                key: 'cta_url',
                label: 'URL del Botón (ancla: #offer o URL externa)',
                type: 'text',
                placeholder: '#offer o https://...',
            },
        ],
    },
    offer: {
        kind: 'generic',
        title: 'Oferta / Pricing',
        fields: [
            { key: 'title', label: 'Título', type: 'text' },
            { key: 'price_current', label: 'Precio', type: 'text' },
            { key: 'cta_text', label: 'Texto del Botón', type: 'text' },
            {
                key: 'cta_url',
                label: 'URL del Botón (ancla: #lead_capture o URL externa)',
                type: 'text',
                placeholder: '#lead_capture o https://...',
            },
        ],
    },
    lead_capture: {
        kind: 'generic',
        title: 'Captura de Leads',
        fieldsFn: (type) => {
            const title = type === 'long_letter' ? 'Contacto / Consultas' : 'Captura de Leads'
            // Note: title override is handled in StepContent via schema.title
            void title // fieldsFn only returns fields; title is static
            return [
                {
                    key: 'headline',
                    label: 'Título del Formulario',
                    type: 'text',
                    placeholder: 'Únete a la lista de espera',
                },
                { key: 'subheadline', label: 'Subtítulo', type: 'text' },
                { key: 'cta_text', label: 'Texto del Botón', type: 'text' },
                {
                    key: 'success_message',
                    label: 'Mensaje de Éxito',
                    type: 'text',
                    placeholder: '¡Gracias!',
                },
            ]
        },
    },
    faq: { kind: 'list', title: 'Preguntas Frecuentes', itemFields: ['question', 'answer'] },
    speaker: {
        kind: 'generic',
        title: 'Speaker / Presentador',
        fields: [
            { key: 'name', label: 'Nombre', type: 'text' },
            { key: 'bio', label: 'Biografía', type: 'textarea' },
            { key: 'photo', label: 'Foto', type: 'image' },
        ],
    },
    learning: { kind: 'simple-list', title: 'Lo que aprenderás' },
    target: { kind: 'list', title: '¿Para quién es?', itemFields: ['title', 'description'] },
    story: {
        kind: 'generic',
        title: 'Historia / Dolor',
        fields: [
            {
                key: 'headline',
                label: 'Titular',
                type: 'text',
                placeholder: 'El marketing tradicional es demasiado lento para el ZMOT.',
            },
            {
                key: 'description',
                label: 'Descripción / Intro',
                type: 'textarea',
                placeholder: '¿Te suena familiar esta historia?',
            },
            {
                key: 'items',
                label: 'Ítems (uno por línea — podés empezar con un emoji 🎯)',
                type: 'textarea',
                placeholder:
                    '🎯 Detectas que tu competencia tiene una debilidad\n💡 Tienes una idea genial para una campaña\n📞 Llamas a tu agencia o equipo interno\n⏰ "Lo tenemos para el viernes que viene"\n💔 Pasan 14 días. El copy no tiene garra.',
            },
            {
                key: 'conclusion',
                label: 'Conclusión destacada',
                type: 'textarea',
                placeholder:
                    'La velocidad de ejecución es la ventaja competitiva definitiva. Tu equipo es un ancla.',
            },
            { key: 'bg_color', label: 'Color de fondo (opcional)', type: 'color' },
        ],
    },
    solution: {
        kind: 'generic',
        title: 'La Solución',
        fields: [
            { key: 'title', label: 'Título', type: 'text' },
            { key: 'text', label: 'Contenido', type: 'textarea' },
        ],
    },
    testimonials: { kind: 'list', title: 'Testimonios', itemFields: ['text', 'author'] },

    // ── Shared Blocks ──
    html_embed: {
        kind: 'generic',
        title: 'HTML Embebido',
        fields: [
            { key: 'title', label: 'Título (opcional)', type: 'text' },
            {
                key: 'html_code',
                label: 'Código HTML (iframe, script, etc.)',
                type: 'textarea',
                placeholder:
                    '<iframe src="https://calendly.com/..." width="100%" height="600"></iframe>',
            },
            { key: 'max_width', label: 'Ancho Máximo', type: 'text', placeholder: '800px' },
        ],
    },
    image_gallery: { kind: 'list', title: 'Galería de Imágenes', itemFields: ['image', 'caption'] },
    pricing: { kind: 'list', title: 'Planes y Precios', itemFields: ['name', 'price', 'cta_text'] },
    team: { kind: 'list', title: 'Equipo', itemFields: ['name', 'role', 'photo'] },
    logo_wall: { kind: 'list', title: 'Logos / Partners', itemFields: ['name', 'logo'] },
    contact: {
        kind: 'generic',
        title: 'Contacto',
        fields: [
            { key: 'title', label: 'Título', type: 'text', placeholder: 'Contacto' },
            { key: 'email', label: 'Email', type: 'text', placeholder: 'info@tuempresa.com' },
            { key: 'phone', label: 'Teléfono', type: 'text', placeholder: '+54 11 1234-5678' },
            { key: 'address', label: 'Dirección', type: 'text' },
            {
                key: 'cta_text',
                label: 'Texto del Botón',
                type: 'text',
                placeholder: 'Enviar Mensaje',
            },
            {
                key: 'success_message',
                label: 'Mensaje de Éxito',
                type: 'text',
                placeholder: '¡Mensaje enviado!',
            },
        ],
    },

    // ── Sector Blocks ──
    services: {
        kind: 'list',
        title: 'Servicios',
        headerFields: ['eyebrow', 'title', 'subtitle', 'cta_text', 'cta_url'],
        itemFields: ['title', 'subtitle', 'description', 'image', 'tag', 'featured'],
    },
    process: processSchema,
    process_steps: processSchema,
    how_it_works: processSchema,
    features: { kind: 'list', title: 'Características', itemFields: ['title', 'description'] },
    skills: { kind: 'list', title: 'Habilidades', itemFields: ['title', 'level'] },
    experience: {
        kind: 'list',
        title: 'Experiencia',
        itemFields: ['title', 'period', 'description'],
    },
    education: { kind: 'list', title: 'Educación', itemFields: ['title', 'period', 'description'] },
    about: {
        kind: 'generic',
        title: 'Sobre Nosotros',
        fields: [
            { key: 'title', label: 'Título', type: 'text', placeholder: 'Nuestra Historia' },
            { key: 'text', label: 'Contenido (acepta HTML)', type: 'textarea' },
        ],
    },
    guarantee: {
        kind: 'generic',
        title: 'Garantía',
        fields: [
            {
                key: 'title',
                label: 'Título',
                type: 'text',
                placeholder: 'Garantía de Satisfacción',
            },
            {
                key: 'text',
                label: 'Descripción',
                type: 'textarea',
                placeholder: '30 días de garantía. Si no estás satisfecho...',
            },
            { key: 'period', label: 'Período', type: 'text', placeholder: '30 días' },
        ],
    },
    comparison: {
        kind: 'list',
        title: 'Comparación',
        headerFields: [
            'title',
            'subtitle',
            'without_title',
            'with_title',
            'bg_image',
            'bg_color',
            'text_color',
            'cta_text',
            'cta_url',
        ],
        itemFields: ['without', 'with'],
    },
    bonus_stack: {
        kind: 'list',
        title: 'Bonos Exclusivos',
        itemFields: ['title', 'description', 'value'],
    },
    portfolio_showcase: {
        kind: 'list',
        title: 'Portfolio / Trabajos',
        itemFields: ['title', 'description', 'image'],
    },
    stats: { kind: 'list', title: 'Estadísticas', itemFields: ['value', 'label'] },
    speakers: { kind: 'list', title: 'Speakers', itemFields: ['name', 'bio', 'photo'] },
    agenda: { kind: 'list', title: 'Agenda', itemFields: ['time', 'title', 'speaker'] },
    sponsors: { kind: 'list', title: 'Sponsors', itemFields: ['name', 'logo'] },
    newsletter: {
        kind: 'generic',
        title: 'Newsletter',
        fields: [
            { key: 'headline', label: 'Título', type: 'text', placeholder: 'Suscríbete' },
            { key: 'subheadline', label: 'Subtítulo', type: 'text' },
        ],
    },
    featured_post: {
        kind: 'generic',
        title: 'Post Destacado',
        fields: [
            { key: 'title', label: 'Título del Post', type: 'text' },
            { key: 'excerpt', label: 'Extracto', type: 'textarea' },
            { key: 'date', label: 'Fecha', type: 'text' },
        ],
    },
    integrations: {
        kind: 'generic',
        title: 'Integraciones',
        fields: [{ key: 'text', label: 'Descripción de Integraciones', type: 'textarea' }],
    },

    tabbed_features: {
        kind: 'list',
        title: 'Pestañas / Features',
        headerFields: ['eyebrow', 'headline', 'subheadline'],
        itemFields: ['title', 'subtitle', 'image', 'description', 'cta_text', 'cta_url'],
    },

    // ── Special steps ──
    tracking: { kind: 'special', component: 'tracking' },
    review: { kind: 'special', component: 'review' },
}

export function getStepSchema(stepId: string): StepSchema | undefined {
    return STEP_SCHEMAS[stepId]
}
