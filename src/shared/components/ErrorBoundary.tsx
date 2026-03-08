'use client'

import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
    children: React.ReactNode
    fallbackMessage?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Structured logging — ready for Sentry/Datadog integration
        const payload = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            componentStack: info.componentStack,
            url: typeof window !== 'undefined' ? window.location.href : '',
        }
        // In production: structured JSON for log aggregation
        if (process.env.NODE_ENV === 'production') {
            console.error(
                JSON.stringify({
                    level: 'error',
                    ts: new Date().toISOString(),
                    feature: 'ui',
                    msg: 'React ErrorBoundary caught',
                    error: payload,
                }),
            )
        } else {
            console.error('[ErrorBoundary]', error, info.componentStack)
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-7 h-7 text-red-400" />
                    </div>
                    <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                        {this.props.fallbackMessage ?? 'Algo salio mal'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mb-4 max-w-md text-center">
                        {this.state.error?.message}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-[var(--cyan)] border border-[var(--cyan)]/30 hover:bg-[var(--cyan)]/10 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reintentar
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
