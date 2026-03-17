'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { logger } from '@/shared/lib/logger'

export default function MainError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        logger.error('MainError', `digest=${error.digest ?? 'none'} message=${error.message}`)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
                <p className="text-base font-semibold text-white mb-1">Ocurrió un error</p>
                {error.digest && (
                    <p className="text-xs text-gray-500 font-mono mb-1">ID: {error.digest}</p>
                )}
                <p className="text-sm text-gray-400">Intentá nuevamente o recargá la página.</p>
            </div>
            <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors"
            >
                <RotateCcw className="w-4 h-4" />
                Reintentar
            </button>
        </div>
    )
}
