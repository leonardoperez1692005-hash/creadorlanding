'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function StrategyError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                Error en ZentrixOS Strategy
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4 max-w-md text-center">
                {error.message}
            </p>
            <button
                onClick={reset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-[var(--cyan)] border border-[var(--cyan)]/30 hover:bg-[var(--cyan)]/10 transition-colors"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                Reintentar
            </button>
        </div>
    )
}
