'use client'

import {
    Flame,
    MessageSquareQuote,
    AlertTriangle,
    CheckCircle2,
    Scissors,
    TrendingUp,
    Heart,
    BarChart,
    Loader2,
    Film,
    Download,
    XCircle,
} from 'lucide-react'
import { useVideoRepurposerStore } from '../store/videoRepurposerStore'
import type { MomentType, ClipStatus } from '../types'

const CLIP_STATUS_CONFIG: Record<ClipStatus, { label: string; color: string; icon: typeof Film }> =
    {
        pending: { label: 'Pendiente', color: '#94a3b8', icon: Film },
        processing: { label: 'Cortando...', color: '#FBBF24', icon: Loader2 },
        ready: { label: 'Listo', color: '#34D399', icon: Download },
        error: { label: 'Error', color: '#F87171', icon: XCircle },
    }

const MOMENT_CONFIG: Record<MomentType, { label: string; color: string; icon: typeof Flame }> = {
    controversial: { label: 'Polémico', color: '#F87171', icon: Flame },
    factcheck: { label: 'Fact-check', color: '#FBBF24', icon: AlertTriangle },
    contradiction: { label: 'Contradicción', color: '#FB923C', icon: Scissors },
    empty_promise: { label: 'Promesa vacía', color: '#A78BFA', icon: MessageSquareQuote },
    quotable: { label: 'Quotable', color: '#34D399', icon: CheckCircle2 },
    emotional: { label: 'Emotivo', color: '#F472B6', icon: Heart },
    data_point: { label: 'Dato', color: '#60A5FA', icon: BarChart },
}

export function MomentsList() {
    const analysis = useVideoRepurposerStore((s) => s.analysis)
    const selectedMoments = useVideoRepurposerStore((s) => s.selectedMoments)
    const toggleMoment = useVideoRepurposerStore((s) => s.toggleMoment)
    const selectAllMoments = useVideoRepurposerStore((s) => s.selectAllMoments)
    const clips = useVideoRepurposerStore((s) => s.clips)

    if (!analysis) return null

    const allSelected = selectedMoments.length === analysis.moments.length

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} color="#7C3AED" />
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                        Momentos Detectados ({analysis.moments.length})
                    </h4>
                </div>
                <button
                    onClick={selectAllMoments}
                    style={{
                        color: '#00c8ff',
                        fontSize: '0.75rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                    }}
                >
                    {allSelected ? `${selectedMoments.length} seleccionados` : 'Seleccionar todos'}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analysis.moments.map((moment, index) => {
                    const config = MOMENT_CONFIG[moment.type] ?? MOMENT_CONFIG.quotable
                    const Icon = config.icon
                    const isSelected = selectedMoments.includes(index)
                    const clip = clips.find((c) => c.moment_index === index)
                    const clipConfig = clip ? CLIP_STATUS_CONFIG[clip.status] : null
                    const ClipIcon = clipConfig?.icon

                    return (
                        <div
                            key={index}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleMoment(index)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    toggleMoment(index)
                                }
                            }}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                background: isSelected
                                    ? 'rgba(124,58,237,0.1)'
                                    : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isSelected ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                }}
                            >
                                {/* Checkbox */}
                                <div
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                        border: `2px solid ${isSelected ? '#7C3AED' : 'rgba(255,255,255,0.2)'}`,
                                        background: isSelected ? '#7C3AED' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '0.1rem',
                                    }}
                                >
                                    {isSelected && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path
                                                d="M2 6L5 9L10 3"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Header row */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginBottom: '0.35rem',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {/* Timestamp */}
                                        <span
                                            style={{
                                                color: '#00c8ff',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            [{moment.timestamp_start} → {moment.timestamp_end}]
                                        </span>

                                        {/* Type badge */}
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '999px',
                                                background: `${config.color}20`,
                                                color: config.color,
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            <Icon size={10} />
                                            {config.label}
                                        </span>

                                        {/* Score */}
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.2rem',
                                                color:
                                                    moment.virality_score >= 8
                                                        ? '#F87171'
                                                        : '#FBBF24',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            <Flame size={12} />
                                            {moment.virality_score}/10
                                        </span>

                                        {/* Clip status badge */}
                                        {clipConfig && ClipIcon && (
                                            <span
                                                title={clip?.error ?? undefined}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '999px',
                                                    background: `${clipConfig.color}20`,
                                                    color: clipConfig.color,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <ClipIcon
                                                    size={10}
                                                    className={
                                                        clip?.status === 'processing'
                                                            ? 'animate-spin'
                                                            : ''
                                                    }
                                                />
                                                {clip?.status === 'ready' && clip.clip_url ? (
                                                    <a
                                                        href={clip.clip_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            color: clipConfig.color,
                                                            textDecoration: 'underline',
                                                        }}
                                                    >
                                                        Descargar clip
                                                    </a>
                                                ) : (
                                                    clipConfig.label
                                                )}
                                            </span>
                                        )}
                                        {/* Show clip error message inline */}
                                        {clip?.status === 'error' && clip.error && (
                                            <span
                                                style={{
                                                    color: '#F87171',
                                                    fontSize: '0.6rem',
                                                    fontWeight: 500,
                                                    maxWidth: '300px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {clip.error}
                                            </span>
                                        )}
                                    </div>

                                    {/* Transcript */}
                                    <p
                                        style={{
                                            color: '#e0e4f0',
                                            fontSize: '0.8rem',
                                            lineHeight: 1.5,
                                            margin: '0 0 0.35rem',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        &ldquo;{moment.transcript}&rdquo;
                                    </p>

                                    {/* Analysis */}
                                    <p
                                        style={{
                                            color: '#8b9ec7',
                                            fontSize: '0.75rem',
                                            margin: '0 0 0.2rem',
                                        }}
                                    >
                                        {moment.analysis}
                                    </p>

                                    {/* Contrast angle */}
                                    <p
                                        style={{
                                            color: '#7C3AED',
                                            fontSize: '0.7rem',
                                            margin: 0,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Contraste: {moment.contrast_angle}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
