import { memo, useMemo } from 'react'
import Image from 'next/image'
import type { WizardSection } from '../../types'
import type { PreviewContent, ContentItem } from './types'

interface PreviewHeaderProps {
    sections: WizardSection[]
    projectName: string
    isMobile: boolean
}

export const PreviewHeader = memo(function PreviewHeader({
    sections,
    projectName,
    isMobile: m,
}: PreviewHeaderProps) {
    const headerSection = useMemo(
        () => sections.find((s) => s.type === 'header' && s.isVisible),
        [sections],
    )
    const content = (headerSection?.content ?? {}) as PreviewContent
    const logoText = content.logo_text || projectName || 'Mi Landing Page'
    const logoImage = content.logo_image
    const navItems: ContentItem[] = useMemo(
        () => (Array.isArray(content.items) ? content.items : []),
        [content.items],
    )
    const ctaText = content.cta_text

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
})
