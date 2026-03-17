'use client'

// ─── Types ───────────────────────────────────────────────

type ReliabilityLevel = 'limited' | 'moderate' | 'solid' | 'robust'

interface SourceBreakdown {
    tweets: number
    news: number
    reddit: number
    youtube: number
    trends: number
}

interface AnalysisReliabilityProps {
    totalSources: number
    breakdown?: Partial<SourceBreakdown>
    daysRange?: number
    /** ISO date string — if provided, shows "Período: [date-7d] → [date]" instead of "Últimos N días" */
    generatedAt?: string
    className?: string
    compact?: boolean
    /** Label for the count. Default: "fuentes" */
    countLabel?: string
}

// ─── Helpers ─────────────────────────────────────────────

/**
 * Reliability levels based on statistical sampling theory (95% confidence):
 * - < 50 items → margin of error > ±14% → limited (orientative only)
 * - 50-99 → margin ±10-14% → moderate (clear trends)
 * - 100-384 → margin ±5-10% → solid (reliable analysis)
 * - 385+ → margin < ±5% → robust (professional survey level, per Cochran's formula)
 *
 * Reference: Cochran (1977) sample size formula for proportions at 95% CI.
 * Comparable to Pew Research (~1,000 for ±3%) and Latinobarómetro (~1,000/country).
 * Note: social listening ≠ random survey — measures published opinion, not population sentiment.
 */
function getReliabilityLevel(total: number): ReliabilityLevel {
    if (total >= 385) return 'robust' // ±5% margin — survey-grade
    if (total >= 100) return 'solid' // ±10% margin — reliable
    if (total >= 50) return 'moderate' // ±14% margin — trends visible
    return 'limited' // >±14% — orientative
}

const levelConfig: Record<
    ReliabilityLevel,
    { color: string; bg: string; border: string; label: string; description: string }
> = {
    limited: {
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        label: 'Muestra limitada',
        description: 'Menos de 50 opiniones — margen de error >±14%',
    },
    moderate: {
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        label: 'Muestra moderada',
        description: '50-99 opiniones — margen ±10-14%, tendencias claras',
    },
    solid: {
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        label: 'Muestra sólida',
        description: '100-384 opiniones — margen ±5-10%, análisis confiable',
    },
    robust: {
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        label: 'Muestra robusta',
        description: '385+ opiniones — margen <±5%, nivel encuesta profesional',
    },
}

// ─── Source type labels ──────────────────────────────────

const sourceLabels: Record<keyof SourceBreakdown, { icon: string; label: string }> = {
    tweets: { icon: '𝕏', label: 'Tweets' },
    news: { icon: '📰', label: 'Noticias' },
    reddit: { icon: '💬', label: 'Reddit' },
    youtube: { icon: '▶', label: 'YouTube' },
    trends: { icon: '📈', label: 'Trends' },
}

// ─── Component ───────────────────────────────────────────

export function AnalysisReliability({
    totalSources,
    breakdown,
    daysRange,
    generatedAt,
    className = '',
    compact = false,
    countLabel = 'fuentes',
}: AnalysisReliabilityProps) {
    const level = getReliabilityLevel(totalSources)
    const config = levelConfig[level]

    if (compact) {
        return (
            <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.border} border ${className}`}
            >
                <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                <span className={`text-xs font-medium ${config.color}`}>
                    {totalSources} {countLabel}
                </span>
                <span className="text-[10px] text-[var(--foreground)]/50">{config.label}</span>
            </div>
        )
    }

    const breakdownEntries = breakdown
        ? (Object.entries(breakdown) as [keyof SourceBreakdown, number | undefined][]).filter(
              ([, v]) => v !== undefined && v > 0,
          )
        : []

    return (
        <div className={`rounded-lg border ${config.border} ${config.bg} p-4 ${className}`}>
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span
                        className={`w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-')} ring-2 ring-offset-1 ring-offset-[var(--card)] ${config.color.replace('text-', 'ring-')}/30`}
                    />
                    <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                            {totalSources.toLocaleString('es-AR')} {countLabel}
                        </p>
                        <p className="text-xs text-[var(--foreground)]/60 mt-0.5">
                            {config.description}
                        </p>
                    </div>
                </div>
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}
                >
                    {config.label}
                </span>
            </div>

            {/* Breakdown + temporal range */}
            {(breakdownEntries.length > 0 || daysRange) && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]/50 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {breakdownEntries.map(([key, count]) => {
                        const info = sourceLabels[key]
                        return (
                            <div key={key} className="flex items-center gap-1.5">
                                <span className="text-xs">{info.icon}</span>
                                <span className="text-xs text-[var(--foreground)]/70">
                                    {count!.toLocaleString('es-AR')} {info.label}
                                </span>
                            </div>
                        )
                    })}
                    {(daysRange || generatedAt) && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/50">
                            <span>🗓</span>
                            <span>
                                {generatedAt
                                    ? (() => {
                                          const end = new Date(generatedAt)
                                          const start = new Date(end)
                                          start.setDate(start.getDate() - (daysRange ?? 7))
                                          const fmt = (d: Date) =>
                                              d.toLocaleDateString('es-AR', {
                                                  day: 'numeric',
                                                  month: 'short',
                                              })
                                          return `Período: ${fmt(start)} → ${fmt(end)}`
                                      })()
                                    : `Últimos ${daysRange} días`}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
