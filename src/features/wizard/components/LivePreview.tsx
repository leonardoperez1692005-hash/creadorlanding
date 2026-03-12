'use client'

import { useMemo } from 'react'
import { useWizardStore } from '../store/wizardStore'
import type { WizardSection, DesignColors } from '../types'
import { PreviewSection } from './preview/PreviewSection'
import { PreviewHeader } from './preview/PreviewHeader'
import { PreviewFooter } from './preview/PreviewFooter'

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
    const storeSections = useWizardStore((s) => s.sections)
    const storeColors = useWizardStore((s) => s.customColors)
    const storeVisualModel = useWizardStore((s) => s.visualModel)
    const storeProjectName = useWizardStore((s) => s.projectName)

    const sections = data?.sections ?? storeSections
    const customColors = data?.customColors ?? storeColors
    const visualModel = data?.visualModel ?? storeVisualModel
    const projectName = data?.projectName ?? storeProjectName

    const cssVars = useMemo(
        () =>
            ({
                '--preview-primary': customColors.primary || '#00F0FF',
                '--preview-secondary': customColors.secondary || '#7C3AED',
                '--preview-accent': customColors.accent || '#FF007F',
                '--preview-bg': visualModel === 'dark' ? '#0A0E1A' : '#F9FAFB',
                '--preview-text': visualModel === 'dark' ? '#FFFFFF' : '#111827',
                '--preview-muted':
                    visualModel === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                '--preview-card-bg':
                    visualModel === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
            }) as React.CSSProperties,
        [customColors.primary, customColors.secondary, customColors.accent, visualModel],
    )

    const visibleSections = useMemo(
        () =>
            sections
                .filter((s) => s.isVisible && s.type !== 'header')
                .sort((a, b) => a.order - b.order),
        [sections],
    )

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
                <PreviewHeader sections={sections} projectName={projectName} isMobile={isMobile} />

                <main>
                    {visibleSections.map((section) => (
                        <PreviewSection key={section.id} section={section} isMobile={isMobile} />
                    ))}
                </main>

                <PreviewFooter projectName={projectName} isMobile={isMobile} />
            </div>
        </div>
    )
}
