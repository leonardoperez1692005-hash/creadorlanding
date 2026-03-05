import { Suspense } from 'react'
import { TemplateGallery } from '@/features/templates'

export default function TemplatesPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center" style={{ background: '#0A0E1A' }}>
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#00F0FF' }} />
                    <p className="text-sm" style={{ color: '#5d7099' }}>Cargando plantillas...</p>
                </div>
            </div>
        }>
            <TemplateGallery />
        </Suspense>
    )
}
