import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeAndMergeSections } from '@/features/wizard/config/constants'
import { PublicLandingClient } from './PublicLandingClient'
import { CompiledHtmlPage } from './CompiledHtmlPage'
import type { WizardSection } from '@/features/wizard/types'
import type { Metadata } from 'next'

async function getProject(slug: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('projects')
        .select('name, structure_type, visual_model, content_data, html_output')
        .eq('slug', slug)
        .single()

    if (error || !data) return null
    return data
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const project = await getProject(slug)
    if (!project) return { title: 'No encontrado' }

    const contentData = typeof project.content_data === 'string'
        ? JSON.parse(project.content_data)
        : (project.content_data as Record<string, unknown>) ?? {}

    const meta = (contentData['meta'] as Record<string, string>) ?? {}

    return {
        title: meta.seo_title || project.name,
        robots: 'index, follow',
    }
}

export default async function PublicLandingPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const project = await getProject(slug)
    if (!project) notFound()

    // If compiled HTML exists, serve it directly (standalone, fastest)
    if (project.html_output) {
        return <CompiledHtmlPage html={project.html_output} />
    }

    // Fallback: render with React components (draft preview)
    const contentData = typeof project.content_data === 'string'
        ? JSON.parse(project.content_data)
        : (project.content_data as Record<string, unknown>) ?? {}

    const rawSections = (contentData['sections'] as unknown[]) ?? []
    const sections = normalizeAndMergeSections(rawSections, project.structure_type) as WizardSection[]
    const colors = (contentData['colors'] as Record<string, string>) ?? {}
    const meta = (contentData['meta'] as Record<string, string>) ?? {}

    return (
        <PublicLandingClient
            projectName={project.name}
            visualModel={project.visual_model}
            sections={sections}
            colors={colors}
            meta={meta}
        />
    )
}
