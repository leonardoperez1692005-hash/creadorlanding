import { memo } from 'react'

interface PreviewFooterProps {
    projectName: string
    isMobile: boolean
}

export const PreviewFooter = memo(function PreviewFooter({
    projectName,
    isMobile,
}: PreviewFooterProps) {
    return (
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
                &copy; {new Date().getFullYear()} {projectName || 'BrandCommerce'}. Todos los
                derechos reservados.
            </p>
        </footer>
    )
})
