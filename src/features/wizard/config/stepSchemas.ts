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
}

interface StepSchemaSimpleList {
  kind: 'simple-list'
  title: string
}

interface StepSchemaSpecial {
  kind: 'special'
  component: 'tracking' | 'review'
}

export type StepSchema = StepSchemaGeneric | StepSchemaList | StepSchemaSimpleList | StepSchemaSpecial

// ─── Reusable schemas (for aliases) ───────────────────────────

const processSchema: StepSchemaList = {
  kind: 'list',
  title: 'Proceso / Cómo Funciona',
  itemFields: ['title', 'description'],
}

// ─── Schema map ───────────────────────────────────────────────

const STEP_SCHEMAS: Record<string, StepSchema> = {
  // ── Core VSL blocks ──
  hero: {
    kind: 'generic',
    title: 'Hero Section',
    fieldsFn: (type) => [
      { key: 'headline', label: 'Título Principal', type: 'text' },
      { key: 'subheadline', label: 'Subtítulo', type: 'text' },
      ...(type === 'vsl' ? [{ key: 'video_url', label: 'URL del Video (YouTube)', type: 'url' as const }] : []),
      ...(type === 'webinar' ? [
        { key: 'date', label: 'Fecha del Evento', type: 'text' as const },
        { key: 'cta_text', label: 'Texto del Botón', type: 'text' as const },
      ] : []),
      ...(type === 'long_letter' ? [
        { key: 'eyebrow', label: 'Eyebrow (texto superior)', type: 'text' as const },
        { key: 'lead', label: 'Lead (párrafo gancho)', type: 'textarea' as const },
      ] : []),
    ],
  },
  benefits: { kind: 'list', title: 'Beneficios', itemFields: ['title', 'description'] },
  urgency: {
    kind: 'generic',
    title: 'Banner de Urgencia',
    fields: [{ key: 'text', label: 'Texto de urgencia', type: 'text', placeholder: '⚡ OFERTA POR TIEMPO LIMITADO ⚡' }],
  },
  countdown: {
    kind: 'generic',
    title: 'Contador Regresivo',
    fields: [
      { key: 'headline', label: 'Texto sobre el contador', type: 'text', placeholder: 'La oferta expira en:' },
      { key: 'end_date', label: 'Fecha de Fin', type: 'datetime-local' },
      { key: 'cta_text', label: 'Texto del Botón', type: 'text' },
      { key: 'cta_url', label: 'URL del Botón', type: 'url' },
    ],
  },
  offer: {
    kind: 'generic',
    title: 'Oferta / Pricing',
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'price_current', label: 'Precio', type: 'text' },
      { key: 'cta_text', label: 'Texto del Botón', type: 'text' },
      { key: 'cta_url', label: 'URL del Botón', type: 'url' },
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
        { key: 'headline', label: 'Título del Formulario', type: 'text', placeholder: 'Únete a la lista de espera' },
        { key: 'subheadline', label: 'Subtítulo', type: 'text' },
        { key: 'cta_text', label: 'Texto del Botón', type: 'text' },
        { key: 'success_message', label: 'Mensaje de Éxito', type: 'text', placeholder: '¡Gracias!' },
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
    title: 'Tu Historia',
    fields: [{ key: 'text', label: 'Contenido (acepta HTML)', type: 'textarea' }],
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
      { key: 'html_code', label: 'Código HTML (iframe, script, etc.)', type: 'textarea', placeholder: '<iframe src="https://calendly.com/..." width="100%" height="600"></iframe>' },
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
      { key: 'cta_text', label: 'Texto del Botón', type: 'text', placeholder: 'Enviar Mensaje' },
      { key: 'success_message', label: 'Mensaje de Éxito', type: 'text', placeholder: '¡Mensaje enviado!' },
    ],
  },

  // ── Sector Blocks ──
  services: { kind: 'list', title: 'Servicios', itemFields: ['title', 'description'] },
  process: processSchema,
  process_steps: processSchema,
  how_it_works: processSchema,
  features: { kind: 'list', title: 'Características', itemFields: ['title', 'description'] },
  skills: { kind: 'list', title: 'Habilidades', itemFields: ['title', 'level'] },
  experience: { kind: 'list', title: 'Experiencia', itemFields: ['title', 'period', 'description'] },
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
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Garantía de Satisfacción' },
      { key: 'text', label: 'Descripción', type: 'textarea', placeholder: '30 días de garantía. Si no estás satisfecho...' },
      { key: 'period', label: 'Período', type: 'text', placeholder: '30 días' },
    ],
  },
  comparison: {
    kind: 'generic',
    title: 'Comparación',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: '¿Por qué elegirnos?' },
      { key: 'without_title', label: 'Título Izquierda', type: 'text', placeholder: 'Sin Nuestra Solución' },
      { key: 'with_title', label: 'Título Derecha', type: 'text', placeholder: 'Con Nuestra Solución' },
    ],
  },
  bonus_stack: { kind: 'list', title: 'Bonos Exclusivos', itemFields: ['title', 'description', 'value'] },
  portfolio_showcase: { kind: 'list', title: 'Portfolio / Trabajos', itemFields: ['title', 'description', 'image'] },
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

  // ── Special steps ──
  tracking: { kind: 'special', component: 'tracking' },
  review: { kind: 'special', component: 'review' },
}

export function getStepSchema(stepId: string): StepSchema | undefined {
  return STEP_SCHEMAS[stepId]
}
