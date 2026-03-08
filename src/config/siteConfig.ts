// ============================================================
// SITE CONFIG - ZentrixOS
// ============================================================

export const DEFAULT_ROUTE = '/' as const

export interface SiteConfig {
    appName: string
    appSlogan: string
    appDescription: string
    seo: {
        siteTitle: string
        titleTemplate: string
        defaultDescription: string
        locale: string
    }
}

export const siteConfig: SiteConfig = {
    appName: 'ZentrixOS',
    appSlogan: 'Fábrica de Landing Pages de Alto Rendimiento',
    appDescription:
        'Creá landing pages estáticas ultra-rápidas y seguras, desplegables en tu WordPress con un solo clic.',

    seo: {
        siteTitle: 'ZentrixOS | Landing Pages de Alto Rendimiento',
        titleTemplate: '%s | ZentrixOS',
        defaultDescription:
            'Generador de landing pages estáticas con IA, diseño profesional y velocidad extrema.',
        locale: 'es_AR',
    },
}
