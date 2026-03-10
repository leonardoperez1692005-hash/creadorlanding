'use client'

import Image from 'next/image'
import { useWizardStore } from '../store/wizardStore'
import type { WizardSection, DesignColors } from '../types'
import { PreviewSection } from './preview/PreviewSection'
import type { PreviewContent, ContentItem } from './preview/types'

interface LivePreviewProps {
    isMobile?: boolean
    /** Optional overrides for standalone rendering (public pages) */
    data?: {
        sections: WizardSection[]
        customColors: DesignColors
        visualModel: 'dark' | 'light'
        projectName: string
    }
}

export function LivePreview({ isMobile = false, data }: LivePreviewProps) {
    const store = useWizardStore()
    const sections = data?.sections ?? store.sections
    const customColors = data?.customColors ?? store.customColors
    const visualModel = data?.visualModel ?? store.visualModel
    const projectName = data?.projectName ?? store.projectName

    // Map custom colors to CSS variables
    const cssVars = {
        '--preview-primary': customColors.primary || '#00F0FF',
        '--preview-secondary': customColors.secondary || '#7C3AED',
        '--preview-accent': customColors.accent || '#FF007F',
        '--preview-bg': visualModel === 'dark' ? '#0A0E1A' : '#F9FAFB',
        '--preview-text': visualModel === 'dark' ? '#FFFFFF' : '#111827',
        '--preview-muted': visualModel === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        '--preview-card-bg':
            visualModel === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    } as React.CSSProperties

    return (
        <div
            className="w-full h-full overflow-y-auto relative no-scrollbar selection:bg-cyan-500/30"
            style={cssVars}
        >
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                .preview-font { font-family: 'Outfit', sans-serif; }
                .glass { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
            `,
                }}
            />
            <div
                className="min-h-full preview-font transition-colors duration-300 pb-20"
                style={{ backgroundColor: 'var(--preview-bg)', color: 'var(--preview-text)' }}
            >
                {/* Header with nav */}
                <PreviewHeader sections={sections} projectName={projectName} isMobile={isMobile} />

                <main>
                    {sections
                        .filter((s) => s.isVisible && s.type !== 'header')
                        .sort((a, b) => a.order - b.order)
                        .map((section) => (
                            <PreviewSection
                                key={section.id}
                                section={section}
                                isMobile={isMobile}
                            />
                        ))}
                </main>

                <footer
                    className={`${isMobile ? 'py-8 px-4 mt-10' : 'py-16 px-6 mt-20'} border-t border-opacity-10 text-center`}
                    style={{ borderColor: 'var(--preview-muted)' }}
                >
                    <div
                        className={`font-bold ${isMobile ? 'text-base mb-3' : 'text-2xl mb-6'} tracking-tighter`}
                        style={{ color: 'var(--preview-primary)' }}
                    >
                        {projectName || 'Mi Landing Page'}
                    </div>
                    <p className={`opacity-50 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        &copy; {new Date().getFullYear()} {projectName || 'BrandCommerce'}. Todos
                        los derechos reservados.
                    </p>
                </footer>
            </div>
        </div>
    )
}

function PreviewHeader({
    sections,
    projectName,
    isMobile,
}: {
    sections: WizardSection[]
    projectName: string
    isMobile: boolean
}) {
    const headerSection = sections.find((s) => s.type === 'header' && s.isVisible)
    const content = (headerSection?.content ?? {}) as PreviewContent
    const logoText = content.logo_text || projectName || 'Mi Landing Page'
    const logoImage = content.logo_image
    const navItems: ContentItem[] = Array.isArray(content.items) ? content.items : []
    const ctaText = content.cta_text
    const m = isMobile

    return (
        <header
            className={`${m ? 'px-4 py-3' : 'px-6 py-5'} border-b border-opacity-20 max-w-6xl mx-auto`}
            style={{ borderColor: 'var(--preview-muted)' }}
        >
            <div className="flex items-center justify-between">
                {logoImage ? (
                    <Image
                        src={logoImage}
                        alt={logoText}
                        width={120}
                        height={36}
                        unoptimized
                        style={{ height: m ? 28 : 36, width: 'auto' }}
                    />
                ) : (
                    <div
                        className={`font-bold ${m ? 'text-base' : 'text-xl'} tracking-tighter`}
                        style={{ color: 'var(--preview-primary)' }}
                    >
                        {logoText}
                    </div>
                )}
                {!m && navItems.length > 0 && (
                    <nav className="flex items-center gap-6">
                        {navItems.map((item, i) => (
                            <span
                                key={i}
                                className="text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                {item.label || `Link ${i + 1}`}
                            </span>
                        ))}
                    </nav>
                )}
                <div className="flex items-center gap-3">
                    {ctaText && (
                        <span
                            className={`${m ? 'px-4 py-1.5 text-xs' : 'px-6 py-2.5 text-sm'} font-bold rounded-lg`}
                            style={{ background: 'var(--preview-primary)', color: '#000' }}
                        >
                            {ctaText}
                        </span>
                    )}
                </div>
            </div>
        </header>
    )
}
