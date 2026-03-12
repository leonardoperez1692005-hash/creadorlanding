import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.brandvortix.com'

    const supabase = createServiceClient()
    const { data: projects } = await supabase
        .from('projects')
        .select('slug, updated_at')
        .not('html_output', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5000)

    const landingPages: MetadataRoute.Sitemap = (projects ?? []).map(
        (p: { slug: string; updated_at: string | null }) => ({
            url: `${baseUrl}/p/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }),
    )

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        ...landingPages,
    ]
}
