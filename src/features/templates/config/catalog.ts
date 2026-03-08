// ============================================================
// Template Catalog — Static definitions for all available templates
// ============================================================

export type TemplateCategory = 'landing' | 'business' | 'portfolio' | 'personal' | 'event'

export interface TemplateSectionDef {
    id: string
    label: string
}

export interface TemplateDef {
    id: string
    name: string
    description: string
    category: TemplateCategory
    tags: string[]
    thumbnail: string
    sections: TemplateSectionDef[]
    defaultContent: Record<string, Record<string, unknown>>
    recommendedFor: string[]
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; icon: string }[] = [
    { id: 'landing', label: 'Landings de Venta', icon: 'Rocket' },
    { id: 'business', label: 'Negocios', icon: 'Briefcase' },
    { id: 'portfolio', label: 'Portfolio', icon: 'Image' },
    { id: 'personal', label: 'Blog / Personal', icon: 'User' },
    { id: 'event', label: 'Eventos', icon: 'Calendar' },
]

// ============================================================
// LANDING TEMPLATES (existing, migrated)
// ============================================================

const TPL_VSL: TemplateDef = {
    id: 'vsl',
    name: 'Video Sales Letter',
    description:
        'Página centrada en video de alta conversión. Ideal para productos digitales y cursos.',
    category: 'landing',
    tags: ['ventas', 'video', 'conversión', 'curso'],
    thumbnail: '/templates/previews/vsl.png',
    recommendedFor: ['cursos', 'coaching', 'productos digitales'],
    sections: [
        { id: 'hero', label: 'Sección Hero' },
        { id: 'benefits', label: 'Beneficios' },
        { id: 'urgency', label: 'Urgencia' },
        { id: 'countdown', label: 'Contador' },
        { id: 'offer', label: 'Oferta' },
        { id: 'lead_capture', label: 'Captura de Leads' },
        { id: 'faq', label: 'Preguntas Frecuentes' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Tu Titular Aquí',
            subheadline: 'Subtítulo persuasivo',
            cta_text: 'Ver Video',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
            video_url: '',
        },
        benefits: {
            items: [
                { title: 'Beneficio 1', description: 'Descripción' },
                { title: 'Beneficio 2', description: 'Descripción' },
                { title: 'Beneficio 3', description: 'Descripción' },
            ],
        },
        urgency: { text: 'OFERTA LIMITADA' },
        countdown: { headline: 'Esta oferta expira en:', cta_text: 'ACCEDER AHORA' },
        offer: { title: 'Oferta Especial', price_current: '$99', cta_text: 'COMPRAR', cta_url: '' },
        lead_capture: {
            headline: 'Únete Ahora',
            subheadline: 'Ingresa tu email',
            cta_text: 'ENVIAR',
            success_message: '¡Listo!',
        },
        faq: { items: [{ question: '¿Cómo funciona?', answer: 'Respuesta aquí.' }] },
    },
}

const TPL_WEBINAR: TemplateDef = {
    id: 'webinar',
    name: 'Registro a Webinar',
    description: 'Ideal para eventos en vivo, masterclasses y presentaciones online.',
    category: 'landing',
    tags: ['webinar', 'evento', 'registro', 'masterclass'],
    thumbnail: '/templates/previews/webinar.png',
    recommendedFor: ['educación', 'coaching', 'consultoría'],
    sections: [
        { id: 'hero', label: 'Sección Hero' },
        { id: 'speaker', label: 'Presentador' },
        { id: 'learning', label: 'Lo que aprenderás' },
        { id: 'target', label: '¿Para quién es?' },
        { id: 'urgency', label: 'Urgencia' },
        { id: 'countdown', label: 'Contador' },
        { id: 'offer', label: 'Oferta' },
        { id: 'lead_capture', label: 'Captura de Leads' },
        { id: 'faq', label: 'Preguntas Frecuentes' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Masterclass Gratuita',
            subheadline: 'Aprende los secretos de...',
            date: '',
            cta_text: 'RESERVAR MI LUGAR',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        speaker: { name: 'Tu Nombre', bio: 'Experto en...', photo: '' },
        learning: { items: ['Punto clave 1', 'Punto clave 2', 'Punto clave 3'] },
        target: { items: [{ title: 'Emprendedores', description: 'Que quieren escalar' }] },
        urgency: { text: 'CUPOS LIMITADOS' },
        countdown: { headline: 'El evento comienza en:', cta_text: 'REGISTRARME' },
        offer: {
            title: 'Acceso Gratuito',
            price_current: 'GRATIS',
            cta_text: 'INSCRIBIRME',
            cta_url: '',
        },
        lead_capture: {
            headline: 'Reserva tu lugar',
            subheadline: 'Solo necesitas tu email',
            cta_text: 'CONFIRMAR',
            success_message: '¡Registrado!',
        },
        faq: { items: [{ question: '¿Es gratuito?', answer: 'Sí, 100% gratuito.' }] },
    },
}

const TPL_LONG_LETTER: TemplateDef = {
    id: 'long_letter',
    name: 'Carta de Ventas',
    description: 'Persuasión escrita detallada y estructurada. Para productos de alto ticket.',
    category: 'landing',
    tags: ['ventas', 'carta', 'copywriting', 'alto ticket'],
    thumbnail: '/templates/previews/long_letter.png',
    recommendedFor: ['servicios premium', 'consultoría', 'alto ticket'],
    sections: [
        { id: 'hero', label: 'Sección Hero' },
        { id: 'story', label: 'Historia' },
        { id: 'solution', label: 'Solución' },
        { id: 'benefits', label: 'Beneficios' },
        { id: 'testimonials', label: 'Testimonios' },
        { id: 'urgency', label: 'Urgencia' },
        { id: 'offer', label: 'Oferta' },
        { id: 'lead_capture', label: 'Contacto / Consultas' },
        { id: 'faq', label: 'Preguntas Frecuentes' },
    ],
    defaultContent: {
        hero: {
            eyebrow: 'EXCLUSIVO',
            headline: 'Titular Impactante',
            subheadline: 'Subtítulo emocional',
            cta_text: 'APLICAR AHORA',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
            lead: 'Párrafo gancho...',
        },
        story: { text: 'Cuenta tu historia aquí...' },
        solution: { title: 'La Solución', text: 'Descripción de tu solución...' },
        benefits: { items: [{ title: 'Beneficio 1', description: 'Descripción' }] },
        testimonials: { items: [{ text: 'Testimonio aquí.', author: 'Cliente Ejemplo' }] },
        urgency: { text: 'ÚLTIMAS PLAZAS' },
        offer: {
            title: 'Tu Inversión',
            price_current: '$297',
            cta_text: 'APLICAR AHORA',
            cta_url: '',
        },
        lead_capture: {
            headline: 'Consulta Gratuita',
            subheadline: 'Agenda una llamada',
            cta_text: 'AGENDAR',
            success_message: '¡Te contactaremos!',
        },
        faq: { items: [{ question: '¿Hay garantía?', answer: 'Sí, 30 días.' }] },
    },
}

// ============================================================
// BUSINESS TEMPLATES (new)
// ============================================================

const TPL_CONSULTANCY: TemplateDef = {
    id: 'consultancy',
    name: 'Consultoría Profesional',
    description: 'Sitio web para consultores, asesores y profesionales independientes.',
    category: 'business',
    tags: ['consultoría', 'profesional', 'servicios', 'B2B'],
    thumbnail: '/templates/previews/consulting.png',
    recommendedFor: ['consultoría', 'asesoría', 'finanzas'],
    sections: [
        { id: 'hero', label: 'Portada' },
        { id: 'services', label: 'Servicios' },
        { id: 'about', label: 'Sobre Nosotros' },
        { id: 'testimonials', label: 'Testimonios' },
        { id: 'process', label: 'Proceso de Trabajo' },
        { id: 'lead_capture', label: 'Contacto' },
        { id: 'faq', label: 'Preguntas Frecuentes' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Consultoría que Transforma',
            subheadline: 'Soluciones estratégicas para tu negocio',
            cta_text: 'AGENDAR CONSULTA',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        services: {
            items: [
                { title: 'Estrategia', description: 'Plan de acción personalizado' },
                { title: 'Implementación', description: 'Ejecución guiada' },
                { title: 'Optimización', description: 'Mejora continua de resultados' },
            ],
        },
        about: { title: 'Nuestra Historia', text: 'Con más de 10 años de experiencia...' },
        testimonials: {
            items: [{ text: 'Excelente servicio profesional.', author: 'María García, CEO' }],
        },
        process: {
            items: [
                { title: 'Diagnóstico', description: 'Análisis inicial' },
                { title: 'Estrategia', description: 'Plan de acción' },
                { title: 'Ejecución', description: 'Implementación' },
            ],
        },
        lead_capture: {
            headline: 'Contacta con Nosotros',
            subheadline: 'Primera consulta gratuita',
            cta_text: 'ENVIAR MENSAJE',
            success_message: '¡Mensaje enviado!',
        },
        faq: { items: [{ question: '¿Cuánto cuesta?', answer: 'Depende del proyecto.' }] },
    },
}

const TPL_AGENCY: TemplateDef = {
    id: 'agency',
    name: 'Agencia Digital',
    description: 'Para agencias de marketing, diseño y desarrollo que quieren impresionar.',
    category: 'business',
    tags: ['agencia', 'marketing', 'diseño', 'digital'],
    thumbnail: '/templates/previews/agency.png',
    recommendedFor: ['marketing digital', 'diseño web', 'publicidad'],
    sections: [
        { id: 'hero', label: 'Portada' },
        { id: 'services', label: 'Servicios' },
        { id: 'portfolio_showcase', label: 'Trabajos Destacados' },
        { id: 'stats', label: 'Números que Importan' },
        { id: 'testimonials', label: 'Clientes Felices' },
        { id: 'team', label: 'Nuestro Equipo' },
        { id: 'lead_capture', label: 'Contacto' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Creamos Experiencias Digitales',
            subheadline: 'Diseño, desarrollo y marketing que convierte',
            cta_text: 'VER PROYECTOS',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        services: {
            items: [
                { title: 'Branding', description: 'Identidad visual completa' },
                { title: 'Web Design', description: 'Sitios que convierten' },
                { title: 'Marketing', description: 'Estrategias de crecimiento' },
            ],
        },
        portfolio_showcase: {
            items: [
                { title: 'Proyecto Alpha', description: 'Rediseño completo', image: '' },
                { title: 'Proyecto Beta', description: 'Campaña digital', image: '' },
            ],
        },
        stats: {
            items: [
                { value: '+200', label: 'Proyectos' },
                { value: '98%', label: 'Satisfacción' },
                { value: '15+', label: 'Años' },
            ],
        },
        testimonials: {
            items: [
                { text: 'Transformaron nuestra presencia digital.', author: 'Carlos López, CMO' },
            ],
        },
        team: { items: [{ name: 'Ana Directora', role: 'CEO & Fundadora', photo: '' }] },
        lead_capture: {
            headline: '¿Listo para empezar?',
            subheadline: 'Cuéntanos tu proyecto',
            cta_text: 'SOLICITAR PROPUESTA',
            success_message: '¡Propuesta en camino!',
        },
    },
}

const TPL_SAAS: TemplateDef = {
    id: 'saas',
    name: 'SaaS / Startup',
    description: 'Landing moderna para productos de software, apps y plataformas tecnológicas.',
    category: 'business',
    tags: ['saas', 'startup', 'tecnología', 'app', 'software'],
    thumbnail: '/templates/previews/saas.png',
    recommendedFor: ['SaaS', 'tecnología', 'startup', 'apps'],
    sections: [
        { id: 'hero', label: 'Hero con Demo' },
        { id: 'features', label: 'Features' },
        { id: 'how_it_works', label: 'Cómo Funciona' },
        { id: 'pricing', label: 'Precios' },
        { id: 'testimonials', label: 'Testimonios' },
        { id: 'integrations', label: 'Integraciones' },
        { id: 'lead_capture', label: 'CTA Final' },
        { id: 'faq', label: 'Preguntas Frecuentes' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'La Herramienta que Necesitas',
            subheadline: 'Automatiza, escala y crece',
            cta_text: 'PROBAR GRATIS',
            cta_url: '',
            secondary_cta_text: 'Ver demo',
            secondary_cta_url: '#',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
            video_url: '',
        },
        features: {
            items: [
                { title: 'Automatización', description: 'Ahorra horas de trabajo manual' },
                { title: 'Analíticas', description: 'Datos en tiempo real' },
                { title: 'Integraciones', description: 'Conecta con tus tools' },
            ],
        },
        how_it_works: {
            items: [
                { title: 'Regístrate', description: 'Crea tu cuenta gratis' },
                { title: 'Configura', description: 'Personaliza en minutos' },
                { title: 'Lanza', description: 'Comienza a crecer' },
            ],
        },
        pricing: {
            items: [
                { name: 'Starter', price: '$29/mes', features: ['Feature 1', 'Feature 2'] },
                {
                    name: 'Pro',
                    price: '$79/mes',
                    features: ['Todo en Starter', 'Feature 3', 'Feature 4'],
                },
            ],
        },
        testimonials: {
            items: [
                {
                    text: 'Simplificó completamente nuestro flujo de trabajo.',
                    author: 'Pedro Martínez, CTO',
                },
            ],
        },
        integrations: { text: 'Conecta con Slack, Zapier, Google, y más de 50 herramientas.' },
        lead_capture: {
            headline: 'Empieza Gratis Hoy',
            subheadline: 'Sin tarjeta de crédito',
            cta_text: 'CREAR CUENTA GRATIS',
            success_message: '¡Bienvenido!',
        },
        faq: { items: [{ question: '¿Hay periodo de prueba?', answer: 'Sí, 14 días gratis.' }] },
    },
}

// ============================================================
// PORTFOLIO TEMPLATES (new)
// ============================================================

const TPL_PORTFOLIO_CREATIVE: TemplateDef = {
    id: 'portfolio_creative',
    name: 'Portfolio Creativo',
    description: 'Muestra tu trabajo con estilo. Ideal para diseñadores, fotógrafos y artistas.',
    category: 'portfolio',
    tags: ['portfolio', 'creativo', 'diseño', 'fotografía'],
    thumbnail: '/templates/previews/creative.png',
    recommendedFor: ['diseño gráfico', 'fotografía', 'arte', 'freelance'],
    sections: [
        { id: 'hero', label: 'Intro Personal' },
        { id: 'portfolio_showcase', label: 'Galería de Trabajos' },
        { id: 'about', label: 'Sobre Mí' },
        { id: 'services', label: 'Servicios' },
        { id: 'testimonials', label: 'Recomendaciones' },
        { id: 'lead_capture', label: 'Contacto' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Diseño con Propósito',
            subheadline: 'Creando experiencias visuales únicas',
            cta_text: 'VER PORTFOLIO',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        portfolio_showcase: {
            items: [
                { title: 'Proyecto 1', description: 'Branding completo', image: '' },
                { title: 'Proyecto 2', description: 'Diseño web', image: '' },
            ],
        },
        about: { title: 'Mi Historia', text: 'Soy un diseñador apasionado por...' },
        services: {
            items: [
                { title: 'Branding', description: 'Identidad visual' },
                { title: 'Web', description: 'Diseño web responsive' },
            ],
        },
        testimonials: { items: [{ text: 'Trabajo excepcional.', author: 'Cliente Satisfecho' }] },
        lead_capture: {
            headline: 'Trabajemos Juntos',
            subheadline: 'Cuéntame tu proyecto',
            cta_text: 'ENVIAR',
            success_message: '¡Te respondo en 24hs!',
        },
    },
}

const TPL_FREELANCER: TemplateDef = {
    id: 'freelancer',
    name: 'Freelancer Pro',
    description: 'Tu carta de presentación digital. Perfecto para consultores y freelancers.',
    category: 'portfolio',
    tags: ['freelancer', 'profesional', 'CV', 'servicios'],
    thumbnail: '/templates/previews/freelancer.png',
    recommendedFor: ['freelance', 'consultor independiente', 'desarrollador'],
    sections: [
        { id: 'hero', label: 'Presentación' },
        { id: 'skills', label: 'Habilidades' },
        { id: 'experience', label: 'Experiencia' },
        { id: 'portfolio_showcase', label: 'Trabajos' },
        { id: 'testimonials', label: 'Recomendaciones' },
        { id: 'lead_capture', label: 'Contacto & Agenda' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Tu Nombre',
            subheadline: 'Especialista en...',
            cta_text: 'CONTÁCTAME',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        skills: {
            items: [
                { title: 'Habilidad 1', level: '95%' },
                { title: 'Habilidad 2', level: '90%' },
            ],
        },
        experience: {
            items: [{ title: 'Empresa X', period: '2020-2024', description: 'Logro principal' }],
        },
        portfolio_showcase: {
            items: [{ title: 'Proyecto', description: 'Descripción', image: '' }],
        },
        testimonials: { items: [{ text: 'Excelente profesional.', author: 'Jefe Anterior' }] },
        lead_capture: {
            headline: 'Hablemos',
            subheadline: 'Disponible para nuevos proyectos',
            cta_text: 'AGENDAR CALL',
            success_message: '¡Agendado!',
        },
    },
}

// ============================================================
// PERSONAL TEMPLATES (new)
// ============================================================

const TPL_BLOG: TemplateDef = {
    id: 'blog_minimal',
    name: 'Blog Minimalista',
    description: 'Comparte tu conocimiento con un diseño limpio y enfocado en el contenido.',
    category: 'personal',
    tags: ['blog', 'minimalista', 'contenido', 'escritor'],
    thumbnail: '/templates/previews/blog.png',
    recommendedFor: ['escritores', 'bloggers', 'creadores de contenido'],
    sections: [
        { id: 'hero', label: 'Cabecera del Blog' },
        { id: 'featured_post', label: 'Post Destacado' },
        { id: 'about', label: 'Sobre el Autor' },
        { id: 'newsletter', label: 'Newsletter' },
        { id: 'lead_capture', label: 'Suscripción' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Mi Blog',
            subheadline: 'Reflexiones sobre tecnología y vida',
            cta_text: 'LEER MÁS',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        featured_post: {
            title: 'Mi Último Artículo',
            excerpt: 'Extracto del post...',
            date: '2026-01-01',
        },
        about: { title: 'Sobre Mí', text: 'Escritor, pensador, creador...' },
        newsletter: { headline: 'No te pierdas nada', subheadline: 'Suscríbete al newsletter' },
        lead_capture: {
            headline: 'Suscríbete',
            subheadline: 'Un email semanal con lo mejor',
            cta_text: 'SUSCRIBIRME',
            success_message: '¡Bienvenido!',
        },
    },
}

const TPL_CV: TemplateDef = {
    id: 'cv_digital',
    name: 'CV Digital',
    description: 'Tu currículum online interactivo. Comparte tu link con reclutadores.',
    category: 'personal',
    tags: ['CV', 'currículum', 'profesional', 'empleo'],
    thumbnail: '/templates/previews/cv_digital.png',
    recommendedFor: ['búsqueda de empleo', 'profesionales'],
    sections: [
        { id: 'hero', label: 'Datos Personales' },
        { id: 'experience', label: 'Experiencia Laboral' },
        { id: 'skills', label: 'Habilidades' },
        { id: 'education', label: 'Educación' },
        { id: 'lead_capture', label: 'Contacto' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Tu Nombre Completo',
            subheadline: 'Título Profesional',
            cta_text: 'DESCARGAR PDF',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        experience: {
            items: [
                {
                    title: 'Puesto',
                    period: '2022-Presente',
                    description: 'Responsabilidades y logros',
                },
            ],
        },
        skills: { items: [{ title: 'Skill', level: '90%' }] },
        education: {
            items: [{ title: 'Universidad', period: '2018-2022', description: 'Carrera' }],
        },
        lead_capture: {
            headline: 'Contacto',
            subheadline: 'Disponible para oportunidades',
            cta_text: 'ENVIAR EMAIL',
            success_message: '¡Gracias!',
        },
    },
}

// ============================================================
// EVENT TEMPLATES (new)
// ============================================================

const TPL_CONFERENCE: TemplateDef = {
    id: 'conference',
    name: 'Conferencia / Summit',
    description: 'Para conferencias, summits y eventos presenciales o híbridos.',
    category: 'event',
    tags: ['conferencia', 'summit', 'evento', 'networking'],
    thumbnail: '/templates/previews/conference.png',
    recommendedFor: ['conferencias', 'summits', 'eventos corporativos'],
    sections: [
        { id: 'hero', label: 'Hero del Evento' },
        { id: 'speakers', label: 'Speakers' },
        { id: 'agenda', label: 'Agenda' },
        { id: 'sponsors', label: 'Sponsors' },
        { id: 'countdown', label: 'Contador' },
        { id: 'pricing', label: 'Tickets' },
        { id: 'lead_capture', label: 'Registro' },
        { id: 'faq', label: 'Preguntas Frecuentes' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Summit 2026',
            subheadline: 'El evento del año en tecnología',
            date: '15 de Marzo, 2026',
            cta_text: 'COMPRAR ENTRADAS',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        speakers: { items: [{ name: 'Speaker 1', bio: 'CEO de...', photo: '' }] },
        agenda: { items: [{ time: '10:00', title: 'Keynote', speaker: 'Speaker 1' }] },
        sponsors: { items: [{ name: 'Sponsor 1', logo: '' }] },
        countdown: { headline: 'Faltan:', cta_text: 'REGISTRARME' },
        pricing: {
            items: [
                { name: 'Early Bird', price: '$99', features: ['Acceso general'] },
                { name: 'VIP', price: '$299', features: ['Acceso VIP', 'Networking'] },
            ],
        },
        lead_capture: {
            headline: 'Asegura tu Lugar',
            subheadline: 'Cupos limitados',
            cta_text: 'REGISTRARME',
            success_message: '¡Registrado!',
        },
        faq: { items: [{ question: '¿Dónde es?', answer: 'En el Centro de Convenciones' }] },
    },
}

const TPL_PRODUCT_LAUNCH: TemplateDef = {
    id: 'product_launch',
    name: 'Lanzamiento de Producto',
    description: 'Genera hype antes del lanzamiento. Perfecto para productos y apps.',
    category: 'event',
    tags: ['lanzamiento', 'producto', 'hype', 'preventa'],
    thumbnail: '/templates/previews/launch.png',
    recommendedFor: ['lanzamientos', 'productos', 'apps', 'ecommerce'],
    sections: [
        { id: 'hero', label: 'Hero del Producto' },
        { id: 'features', label: 'Características' },
        { id: 'how_it_works', label: 'Cómo Funciona' },
        { id: 'countdown', label: 'Cuenta Regresiva' },
        { id: 'testimonials', label: 'Beta Testers' },
        { id: 'pricing', label: 'Precio de Lanzamiento' },
        { id: 'lead_capture', label: 'Lista de Espera' },
    ],
    defaultContent: {
        hero: {
            eyebrow: '',
            headline: 'Algo Grande Viene',
            subheadline: 'El producto que cambiará todo',
            cta_text: 'UNIRME A LA LISTA',
            cta_url: '',
            secondary_cta_text: '',
            secondary_cta_url: '',
            bg_image: '',
            overlay_color: '#000000',
            overlay_opacity: '50',
        },
        features: { items: [{ title: 'Feature 1', description: 'Innovación pura' }] },
        how_it_works: { items: [{ title: 'Paso 1', description: 'Fácil de usar' }] },
        countdown: { headline: 'Lanzamiento en:', cta_text: 'NOTIFÍCAME' },
        testimonials: { items: [{ text: 'Increíble beta testing.', author: 'Beta Tester' }] },
        pricing: { items: [{ name: 'Early Access', price: '$49', features: ['Precio especial'] }] },
        lead_capture: {
            headline: 'Sé el Primero',
            subheadline: 'Acceso anticipado exclusivo',
            cta_text: 'UNIRME',
            success_message: '¡Estás en la lista!',
        },
    },
}

// ============================================================
// FULL CATALOG
// ============================================================

export const TEMPLATE_CATALOG: TemplateDef[] = [
    // Landings
    TPL_VSL,
    TPL_WEBINAR,
    TPL_LONG_LETTER,
    // Business
    TPL_CONSULTANCY,
    TPL_AGENCY,
    TPL_SAAS,
    // Portfolio
    TPL_PORTFOLIO_CREATIVE,
    TPL_FREELANCER,
    // Personal
    TPL_BLOG,
    TPL_CV,
    // Events
    TPL_CONFERENCE,
    TPL_PRODUCT_LAUNCH,
]

// ============================================================
// HELPERS
// ============================================================

export function getTemplateById(id: string): TemplateDef | undefined {
    return TEMPLATE_CATALOG.find((t) => t.id === id)
}

export function getTemplatesByCategory(category: TemplateCategory): TemplateDef[] {
    return TEMPLATE_CATALOG.filter((t) => t.category === category)
}

export function searchTemplates(query: string): TemplateDef[] {
    const q = query.toLowerCase().trim()
    if (!q) return TEMPLATE_CATALOG
    return TEMPLATE_CATALOG.filter(
        (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
            t.category.toLowerCase().includes(q),
    )
}
