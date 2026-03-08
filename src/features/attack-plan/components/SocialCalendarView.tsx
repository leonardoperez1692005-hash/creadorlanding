'use client'

import { useAttackPlanStore } from '../store/attackPlanStore'
import { SocialCalendarGrid } from './SocialCalendarGrid'
import { CalendarDays, Loader2, RotateCcw, Lightbulb, Sparkles } from 'lucide-react'

export function SocialCalendarView() {
    const { calendar, calendarPhase, calendarError, generateCalendar } = useAttackPlanStore()

    // Idle — CTA to generate
    if (calendarPhase === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-[var(--cyan)]/10 flex items-center justify-center mb-5">
                    <CalendarDays className="w-8 h-8 text-[var(--cyan)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                    Calendario de Contenido Social
                </h3>
                <p className="text-sm text-[var(--text-muted)] text-center max-w-md mb-6">
                    Genera una semana completa de contenido para LinkedIn, X, TikTok e Instagram
                    basado en los vectores de ataque de tu plan.
                </p>
                <button
                    onClick={generateCalendar}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-sm transition-all hover:scale-105 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #00C8FF 0%, #7C3AED 100%)' }}
                >
                    <Sparkles className="w-4 h-4" />
                    Generar Calendario Social
                </button>
            </div>
        )
    }

    // Generating
    if (calendarPhase === 'generating') {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-[var(--cyan)]/10 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-[var(--cyan)] animate-spin" />
                </div>
                <p className="text-sm text-[var(--cyan)] mb-1">
                    Creando contenido para 4 plataformas × 7 días...
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                    Esto puede tomar 20-40 segundos...
                </p>
            </div>
        )
    }

    // Error
    if (calendarPhase === 'error') {
        return (
            <div className="max-w-md mx-auto text-center py-16">
                <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3 mb-4">
                    {calendarError}
                </p>
                <button
                    onClick={generateCalendar}
                    className="text-sm text-[var(--cyan)] hover:underline"
                >
                    Reintentar
                </button>
            </div>
        )
    }

    // Complete
    if (!calendar) return null

    return (
        <div className="space-y-6">
            {/* Weekly theme header */}
            <div className="rounded-lg border border-[var(--cyan)]/30 bg-gradient-to-r from-[var(--cyan)]/5 to-transparent p-5">
                <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="w-5 h-5 text-[var(--cyan)]" />
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        Semana de Contenido
                    </h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{calendar.weeklyTheme}</p>
            </div>

            {/* Calendar grid */}
            <SocialCalendarGrid days={calendar.days} />

            {/* Strategic tips */}
            {calendar.tips.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            Tips Estratégicos
                        </h3>
                    </div>
                    <ul className="space-y-2">
                        {calendar.tips.map((tip, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                            >
                                <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Regenerate button */}
            <div className="flex justify-center pt-2">
                <button
                    onClick={generateCalendar}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-[var(--cyan)] border border-[var(--cyan)]/30 hover:bg-[var(--cyan)]/10 transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Regenerar Calendario
                </button>
            </div>
        </div>
    )
}
