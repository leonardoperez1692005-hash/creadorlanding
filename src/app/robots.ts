import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.brandvortix.com'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/p/',
                disallow: ['/admin', '/api/', '/onboarding', '/dashboard', '/wizard'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
