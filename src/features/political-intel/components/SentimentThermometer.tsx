'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    ThumbsUp,
    ThumbsDown,
    Minus,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    MessageSquare,
    Bot,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Edit2,
    Check,
    X,
} from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import {
    analyzeSentimentAction,
    getSentimentHistoryAction,
    type SentimentSnapshot,
} from '../actions/sentiment'
import { AnalysisReliability } from './AnalysisReliability'

// ─── Mini trend bar ───────────────────────────────────────

function TrendBar({ snapshots }: { snapshots: SentimentSnapshot[] }) {
    if (snapshots.length < 2) return null
    const recent = snapshots.slice(-14)
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32, marginTop: 8 }}>
            {recent.map((s, i) => (
                <div
                    key={i}
                    title={`${s.snapshotDate}: +${s.positivePct}% -${s.negativePct}%`}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            background: `linear-gradient(to top, rgba(248,113,113,0.7) ${s.negativePct}%, rgba(52,211,153,0.7) ${s.negativePct}%)`,
                            height: `${Math.max(s.positivePct + s.negativePct, 15)}%`,
                            borderRadius: 2,
                            minHeight: 4,
                        }}
                    />
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: '#334155',
                            marginTop: 2,
                            lineHeight: 1,
                        }}
                    >
                        {s.snapshotDate.slice(-2)}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ─── Query key for localStorage ─────────────────────────

const QUERY_KEY = (handle: string, topic: string) => `sentiment-query:${handle}:${topic}`

// ─── Source badge labels ────────────────────────────────

const SOURCE_LABELS: Record<string, { icon: string; label: string }> = {
    twitter: { icon: '𝕏', label: 'Twitter' },
    reddit: { icon: '💬', label: 'Reddit' },
    youtube: { icon: '▶', label: 'YouTube' },
    serp: { icon: '📰', label: 'Web' },
    nitter: { icon: '🐦', label: 'Nitter' },
}

// ─── Card de termómetro individual (por handle + topic) ──

function ThermometerCard({
    handle,
    displayName,
    topic,
    countryCode,
    handleType,
    defaultQuery,
}: {
    handle: string
    displayName: string
    topic: string
    countryCode: string
    handleType: 'rival' | 'own'
    defaultQuery: string
}) {
    const [snapshots, setSnapshots] = useState<SentimentSnapshot[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showOrganic, setShowOrganic] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const [maxAgeDays, setMaxAgeDays] = useState(30)

    // Editable query
    const [customQuery, setCustomQuery] = useState<string>(() => {
        if (typeof window === 'undefined') return ''
        return localStorage.getItem(QUERY_KEY(handle, topic)) ?? ''
    })
    const [editingQuery, setEditingQuery] = useState(false)
    const [editInput, setEditInput] = useState('')
    const editRef = useRef<HTMLInputElement>(null)

    const activeQuery = customQuery || defaultQuery

    function startEdit() {
        setEditInput(customQuery || defaultQuery)
        setEditingQuery(true)
        setTimeout(() => editRef.current?.focus(), 50)
    }

    function confirmEdit() {
        const val = editInput.trim()
        setCustomQuery(val)
        if (val && val !== defaultQuery) {
            localStorage.setItem(QUERY_KEY(handle, topic), val)
        } else {
            localStorage.removeItem(QUERY_KEY(handle, topic))
            setCustomQuery('')
        }
        setEditingQuery(false)
    }

    function cancelEdit() {
        setEditingQuery(false)
    }

    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

    const hasBotData = !!(latest && latest.botInflationPct > 0)
    const displayPositive =
        showOrganic && hasBotData ? latest!.organicPositivePct : (latest?.positivePct ?? 0)
    const displayNegative =
        showOrganic && hasBotData ? latest!.organicNegativePct : (latest?.negativePct ?? 0)
    const displayNeutral =
        showOrganic && hasBotData
            ? Math.max(0, 100 - latest!.organicPositivePct - latest!.organicNegativePct)
            : (latest?.neutralPct ?? 0)

    // Cargar historial para este handle+tema específico
    const loadHistory = useCallback(async () => {
        const res = await getSentimentHistoryAction(handle, topic)
        if (res.success) setSnapshots(res.data)
    }, [handle, topic])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- loadHistory is async, sets state in callback
        void loadHistory()
    }, [loadHistory])

    async function handleAnalyze() {
        setLoading(true)
        setError(null)
        const res = await analyzeSentimentAction(
            handle,
            displayName,
            [topic],
            countryCode,
            handleType,
            activeQuery !== defaultQuery ? activeQuery : undefined,
            maxAgeDays,
        )
        if (res.success) {
            // Optimistic update: reemplazar por id para evitar duplicados
            setSnapshots((prev) => {
                const filtered = prev.filter((s) => s.id !== res.data.id)
                return [...filtered, res.data].sort((a, b) =>
                    a.snapshotDate.localeCompare(b.snapshotDate),
                )
            })
            setError(null)
        } else {
            setError(res.error)
        }
        setLoading(false)
    }

    const prevSnap = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null
    const positiveTrend = latest && prevSnap ? latest.positivePct - prevSnap.positivePct : null

    const accentColor = handleType === 'own' ? '#7C3AED' : '#00c8ff'

    return (
        <div
            style={{
                background:
                    handleType === 'own' ? 'rgba(124,58,237,0.05)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${handleType === 'own' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 10,
                padding: '0.85rem',
            }}
        >
            {/* Topic pill + edit query + Analizar button */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.65rem',
                    gap: '0.4rem',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: accentColor,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {topic}
                    </span>
                    {/* Edit query button */}
                    <button
                        onClick={startEdit}
                        title={`Query: ${activeQuery}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: 2,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: customQuery ? '#00c8ff' : '#334155',
                            flexShrink: 0,
                        }}
                    >
                        <Edit2 size={9} />
                    </button>
                </div>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}
                >
                    {/* Period selector */}
                    <select
                        value={maxAgeDays}
                        onChange={(e) => setMaxAgeDays(Number(e.target.value))}
                        disabled={loading}
                        aria-label="Período de análisis"
                        style={{
                            padding: '0.2rem 0.3rem',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: '#0A0E1A',
                            border: '1px solid #1e2540',
                            color: '#8b9ec7',
                            cursor: 'pointer',
                        }}
                    >
                        <option value={7}>7 días</option>
                        <option value={14}>14 días</option>
                        <option value={30}>30 días</option>
                        <option value={60}>60 días</option>
                        <option value={90}>90 días</option>
                    </select>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 6,
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            background: 'rgba(0,200,255,0.08)',
                            border: '1px solid rgba(0,200,255,0.2)',
                            color: '#00c8ff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1,
                            flexShrink: 0,
                        }}
                    >
                        <RefreshCw
                            size={10}
                            style={loading ? { animation: 'spin 1s linear infinite' } : {}}
                        />
                        {loading ? 'Analizando...' : latest ? 'Actualizar' : 'Analizar'}
                    </button>
                </div>
            </div>

            {/* Inline query editor */}
            {editingQuery && (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.3rem',
                        marginBottom: '0.6rem',
                        alignItems: 'center',
                    }}
                >
                    <input
                        ref={editRef}
                        type="text"
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmEdit()
                            if (e.key === 'Escape') cancelEdit()
                        }}
                        placeholder={defaultQuery}
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(0,200,255,0.25)',
                            borderRadius: 6,
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.875rem',
                            color: '#e2e8f0',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={confirmEdit}
                        title="Confirmar"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.25rem',
                            background: 'rgba(52,211,153,0.1)',
                            border: '1px solid rgba(52,211,153,0.25)',
                            borderRadius: 5,
                            cursor: 'pointer',
                            color: '#34d399',
                        }}
                    >
                        <Check size={11} />
                    </button>
                    <button
                        onClick={cancelEdit}
                        title="Cancelar"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.25rem',
                            background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            borderRadius: 5,
                            cursor: 'pointer',
                            color: '#f87171',
                        }}
                    >
                        <X size={11} />
                    </button>
                </div>
            )}

            {error && (
                <div style={{ color: '#f87171', fontSize: '0.825rem', marginBottom: '0.5rem' }}>
                    {error}
                </div>
            )}

            {latest ? (
                <>
                    {/* Reliability Badge — uses totalAnalyzed (classified items), not raw source count */}
                    <div style={{ marginBottom: '0.5rem' }}>
                        <AnalysisReliability
                            totalSources={latest.totalAnalyzed}
                            compact
                            countLabel="opiniones analizadas"
                        />
                    </div>

                    {/* Toggle total/orgánico */}
                    {hasBotData && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.3rem',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <button
                                onClick={() => setShowOrganic(false)}
                                style={{
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: 20,
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: !showOrganic
                                        ? 'rgba(0,200,255,0.15)'
                                        : 'transparent',
                                    color: !showOrganic ? '#00c8ff' : '#475569',
                                    outline: !showOrganic
                                        ? '1px solid rgba(0,200,255,0.3)'
                                        : '1px solid transparent',
                                }}
                            >
                                Total
                            </button>
                            <button
                                onClick={() => setShowOrganic(true)}
                                style={{
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: 20,
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: showOrganic
                                        ? 'rgba(52,211,153,0.12)'
                                        : 'transparent',
                                    color: showOrganic ? '#34d399' : '#475569',
                                    outline: showOrganic
                                        ? '1px solid rgba(52,211,153,0.3)'
                                        : '1px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                }}
                            >
                                <Bot size={9} /> Orgánico
                            </button>
                        </div>
                    )}

                    {/* Barra principal */}
                    <div style={{ marginBottom: '0.6rem' }}>
                        <div
                            style={{
                                display: 'flex',
                                height: 16,
                                borderRadius: 8,
                                overflow: 'hidden',
                                gap: 2,
                            }}
                        >
                            <div
                                title={`Positivo: ${displayPositive}%`}
                                style={{
                                    width: `${displayPositive}%`,
                                    background: 'rgba(52,211,153,0.8)',
                                    transition: 'width 0.4s ease',
                                    minWidth: displayPositive > 0 ? 3 : 0,
                                }}
                            />
                            <div
                                title={`Neutral: ${displayNeutral}%`}
                                style={{
                                    width: `${displayNeutral}%`,
                                    background: 'rgba(100,116,139,0.5)',
                                    minWidth: displayNeutral > 0 ? 3 : 0,
                                    transition: 'width 0.4s ease',
                                }}
                            />
                            <div
                                title={`Negativo: ${displayNegative}%`}
                                style={{
                                    width: `${displayNegative}%`,
                                    background: 'rgba(248,113,113,0.8)',
                                    minWidth: displayNegative > 0 ? 3 : 0,
                                    transition: 'width 0.4s ease',
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.6rem',
                                marginTop: '0.3rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '0.85rem',
                                    color: '#34d399',
                                }}
                            >
                                <ThumbsUp size={9} />
                                {displayPositive}%
                            </span>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '0.85rem',
                                    color: '#64748b',
                                }}
                            >
                                <Minus size={9} />
                                {displayNeutral}%
                            </span>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '0.85rem',
                                    color: '#f87171',
                                }}
                            >
                                <ThumbsDown size={9} />
                                {displayNegative}%
                            </span>
                            {positiveTrend !== null && !showOrganic && (
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        fontSize: '0.825rem',
                                        color: positiveTrend >= 0 ? '#34d399' : '#f87171',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    {positiveTrend >= 0 ? (
                                        <TrendingUp size={9} />
                                    ) : (
                                        <TrendingDown size={9} />
                                    )}
                                    {positiveTrend > 0 ? '+' : ''}
                                    {positiveTrend}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bot badges */}
                    {latest.botInflationPct > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.35rem',
                                marginBottom: '0.5rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.8rem',
                                    color: '#94a3b8',
                                    background: 'rgba(100,116,139,0.08)',
                                    border: '1px solid rgba(100,116,139,0.15)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 20,
                                }}
                            >
                                <Bot size={9} />~{latest.botInflationPct}% bots
                            </span>
                            {latest.coordinatedCampaign && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.8rem',
                                        color: '#FBBF24',
                                        background: 'rgba(251,191,36,0.06)',
                                        border: '1px solid rgba(251,191,36,0.18)',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: 20,
                                    }}
                                >
                                    <AlertTriangle size={9} />
                                    Campaña coordinada
                                    {latest.campaignDirection === 'pro'
                                        ? ' a favor'
                                        : latest.campaignDirection === 'anti'
                                          ? ' en contra'
                                          : ''}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Resumen */}
                    {latest.summary && (
                        <p
                            style={{
                                fontSize: '0.875rem',
                                color: '#94a3b8',
                                marginBottom: '0.6rem',
                                lineHeight: 1.5,
                            }}
                        >
                            {latest.summary}
                        </p>
                    )}

                    {/* Temas pro/contra */}
                    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
                        {latest.keyPositiveThemes.length > 0 && (
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: '#34d399',
                                        marginBottom: 3,
                                        fontWeight: 600,
                                    }}
                                >
                                    LO APOYA POR
                                </div>
                                {latest.keyPositiveThemes.slice(0, 3).map((t, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            fontSize: '0.825rem',
                                            color: '#94a3b8',
                                            padding: '1px 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 3,
                                        }}
                                    >
                                        <span style={{ color: '#34d399' }}>+</span> {t}
                                    </div>
                                ))}
                            </div>
                        )}
                        {latest.keyNegativeThemes.length > 0 && (
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: '#f87171',
                                        marginBottom: 3,
                                        fontWeight: 600,
                                    }}
                                >
                                    LO CRITICA POR
                                </div>
                                {latest.keyNegativeThemes.slice(0, 3).map((t, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            fontSize: '0.825rem',
                                            color: '#94a3b8',
                                            padding: '1px 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 3,
                                        }}
                                    >
                                        <span style={{ color: '#f87171' }}>-</span> {t}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Trend chart */}
                    {snapshots.length >= 2 && <TrendBar snapshots={snapshots} />}

                    {/* Comentarios de muestra (colapsable) */}
                    {latest.sampleComments.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setCommentsOpen((o) => !o)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '0.8rem',
                                    color: '#475569',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                {commentsOpen ? (
                                    <ChevronDown size={10} />
                                ) : (
                                    <ChevronRight size={10} />
                                )}
                                <MessageSquare size={9} />
                                {latest.sampleComments.length} comentarios de muestra
                                {latest.sampleComments.some((c) => c.isLikelyBot) && (
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            color: '#64748b',
                                            marginLeft: 4,
                                        }}
                                    >
                                        <Bot size={9} />
                                        {
                                            latest.sampleComments.filter((c) => c.isLikelyBot)
                                                .length
                                        }{' '}
                                        sospechosos
                                    </span>
                                )}
                            </button>
                            {commentsOpen && (
                                <div
                                    style={{
                                        marginTop: '0.4rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 3,
                                    }}
                                >
                                    {latest.sampleComments.map((c, i) => {
                                        const sourceInfo = SOURCE_LABELS[c.source] ?? {
                                            icon: '',
                                            label: c.source,
                                        }
                                        return (
                                            <div
                                                key={i}
                                                title={
                                                    c.isLikelyBot && c.botSignal
                                                        ? `🤖 ${c.botSignal}`
                                                        : `Fuente: ${sourceInfo.label}`
                                                }
                                                style={{
                                                    padding: '0.35rem 0.45rem',
                                                    borderRadius: 5,
                                                    fontSize: '0.85rem',
                                                    color: c.isLikelyBot ? '#64748b' : '#94a3b8',
                                                    opacity: c.isLikelyBot ? 0.6 : 1,
                                                    background: c.isLikelyBot
                                                        ? 'rgba(100,116,139,0.04)'
                                                        : c.sentiment === 'positive'
                                                          ? 'rgba(52,211,153,0.06)'
                                                          : c.sentiment === 'negative'
                                                            ? 'rgba(248,113,113,0.06)'
                                                            : 'rgba(100,116,139,0.06)',
                                                    borderLeft: `2px solid ${
                                                        c.isLikelyBot
                                                            ? '#334155'
                                                            : c.sentiment === 'positive'
                                                              ? '#34d399'
                                                              : c.sentiment === 'negative'
                                                                ? '#f87171'
                                                                : '#64748b'
                                                    }`,
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '0.3rem',
                                                }}
                                            >
                                                {c.isLikelyBot ? (
                                                    <Bot
                                                        size={10}
                                                        style={{
                                                            flexShrink: 0,
                                                            marginTop: 1,
                                                            color: '#475569',
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        style={{
                                                            flexShrink: 0,
                                                            fontSize: '0.8rem',
                                                            marginTop: 1,
                                                        }}
                                                    >
                                                        {sourceInfo.icon}
                                                    </span>
                                                )}
                                                <span style={{ flex: 1 }}>
                                                    {c.text}
                                                    {c.sourceUrl && (
                                                        <>
                                                            {' '}
                                                            <a
                                                                href={c.sourceUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                aria-label={`Ver fuente en ${sourceInfo.label}`}
                                                                style={{
                                                                    color: '#00c8ff',
                                                                    fontSize: '0.8rem',
                                                                    textDecoration: 'none',
                                                                    opacity: 0.7,
                                                                }}
                                                            >
                                                                ↗ ver fuente
                                                            </a>
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            fontSize: '0.8rem',
                            color: '#334155',
                            marginTop: '0.4rem',
                        }}
                    >
                        {latest.totalAnalyzed} opiniones clasificadas ·{' '}
                        {(() => {
                            const dr = latest.dateRange
                            if (dr) {
                                const from = new Date(dr.from + 'T00:00:00').toLocaleDateString(
                                    'es-AR',
                                    { day: 'numeric', month: 'short' },
                                )
                                const to = new Date(dr.to + 'T00:00:00').toLocaleDateString(
                                    'es-AR',
                                    { day: 'numeric', month: 'short' },
                                )
                                return `Período: ${from} → ${to}`
                            }
                            return `Analizado: ${latest.snapshotDate}`
                        })()}
                    </div>
                </>
            ) : (
                <div
                    style={{
                        textAlign: 'center',
                        color: '#475569',
                        fontSize: '0.875rem',
                        padding: '1rem 0',
                    }}
                >
                    Presioná &ldquo;Analizar&rdquo; para medir la opinión pública
                </div>
            )}
        </div>
    )
}

// ─── Grupo de temas por político ──────────────────────────
// Muestra una sección colapsable con una card por tema

function PoliticianGroup({
    handle,
    displayName,
    countryCode,
    handleType,
    topics,
    defaultOpen = true,
}: {
    handle: string
    displayName: string
    countryCode: string
    handleType: 'rival' | 'own'
    topics: string[]
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    const accentColor = handleType === 'own' ? '#7C3AED' : '#00c8ff'

    return (
        <div
            style={{
                marginBottom: '1.5rem',
                background: 'rgba(255,255,255,0.015)',
                border: `1px solid ${handleType === 'own' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 12,
                overflow: 'hidden',
            }}
        >
            {/* Header del político */}
            <button
                onClick={() => setOpen((o) => !o)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: open ? `1px solid rgba(255,255,255,0.05)` : 'none',
                }}
            >
                {open ? (
                    <ChevronDown size={14} color={accentColor} />
                ) : (
                    <ChevronRight size={14} color={accentColor} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1rem' }}>
                        {displayName}
                    </span>
                    {handleType === 'own' && (
                        <span
                            style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#7C3AED',
                                background: 'rgba(124,58,237,0.1)',
                                border: '1px solid rgba(124,58,237,0.2)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: 10,
                            }}
                        >
                            MI CANDIDATO
                        </span>
                    )}
                    <span style={{ color: '#475569', fontSize: '0.875rem' }}>@{handle}</span>
                </div>
                <span
                    style={{
                        fontSize: '0.8rem',
                        color: '#475569',
                    }}
                >
                    {topics.length} tema{topics.length !== 1 ? 's' : ''}
                </span>
            </button>

            {/* Grid de cards por tema */}
            {open && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '0.75rem',
                        padding: '0.75rem',
                    }}
                >
                    {topics.map((topic) => (
                        <ThermometerCard
                            key={topic}
                            handle={handle}
                            displayName={displayName}
                            topic={topic}
                            countryCode={countryCode}
                            handleType={handleType}
                            defaultQuery={`${displayName} ${topic}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Panel principal ───────────────────────────────────────

const OWN_HANDLE_KEY = 'political-intel:own-handle'
const OWN_NAME_KEY = 'political-intel:own-name'
const OWN_COUNTRY_KEY = 'political-intel:own-country'

export function SentimentPanel() {
    const { monitors, campaignProfile } = useIntelligenceStore()
    const [activeTopics, setActiveTopics] = useState<Array<{ name: string }>>([])

    // Handle propio guardado en localStorage
    const [ownHandle, setOwnHandle] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem(OWN_HANDLE_KEY) ?? '') : '',
    )
    const [ownName, setOwnName] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem(OWN_NAME_KEY) ?? '') : '',
    )
    const [ownCountry, setOwnCountry] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem(OWN_COUNTRY_KEY) ?? 'ar') : 'ar',
    )
    const [ownInput, setOwnInput] = useState(ownHandle)
    const [ownNameInput, setOwnNameInput] = useState(ownName)
    const [showOwnForm, setShowOwnForm] = useState(false)

    // Pre-llenar desde perfil de campaña si no hay handle propio guardado
    useEffect(() => {
        if (campaignProfile && !ownHandle) {
            if (campaignProfile.candidateName) setOwnNameInput(campaignProfile.candidateName)
            if (campaignProfile.country) setOwnCountry(campaignProfile.country)
        }
    }, [campaignProfile, ownHandle])

    // Cargar temas activos
    useEffect(() => {
        import('../actions').then(({ listTopicsAction }) => {
            listTopicsAction().then((res: { success: boolean; data?: Array<{ name: string }> }) => {
                if (res.success && res.data) {
                    setActiveTopics(res.data.map((t) => ({ name: t.name })))
                }
            })
        })
    }, [])

    const topics = activeTopics.map((t) => t.name)

    function saveOwnCandidate() {
        const h = ownInput.replace(/^@/, '').trim()
        const n = ownNameInput.trim()
        if (!h) return
        setOwnHandle(h)
        setOwnName(n || h)
        localStorage.setItem(OWN_HANDLE_KEY, h)
        localStorage.setItem(OWN_NAME_KEY, n || h)
        localStorage.setItem(OWN_COUNTRY_KEY, ownCountry)
        setShowOwnForm(false)
    }

    function clearOwnCandidate() {
        setOwnHandle('')
        setOwnName('')
        setOwnInput('')
        setOwnNameInput('')
        localStorage.removeItem(OWN_HANDLE_KEY)
        localStorage.removeItem(OWN_NAME_KEY)
        localStorage.removeItem(OWN_COUNTRY_KEY)
    }

    // Rivales = monitors excluyendo el propio candidato
    const rivalMonitors = monitors.filter((m) => m.handle.toLowerCase() !== ownHandle.toLowerCase())

    if (topics.length === 0) {
        return (
            <div style={{ padding: '2rem' }}>
                <SentimentHeader />
                <div
                    style={{
                        padding: '1.5rem',
                        borderRadius: 10,
                        background: 'rgba(251,191,36,0.06)',
                        border: '1px solid rgba(251,191,36,0.2)',
                        color: '#FBBF24',
                        fontSize: '0.95rem',
                    }}
                >
                    Para usar el Termómetro, primero agregá temas en{' '}
                    <strong>Análisis Temático</strong>. Cada tema se analiza por separado para cada
                    político.
                </div>
            </div>
        )
    }

    if (monitors.length === 0 && !ownHandle) {
        return (
            <div style={{ padding: '2rem' }}>
                <SentimentHeader />
                <div style={{ color: '#475569', textAlign: 'center', padding: '2rem 0' }}>
                    Agregá rivales en Monitors y/o configurá tu propio candidato para medir la
                    opinión pública.
                </div>
            </div>
        )
    }

    return (
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', height: '100%' }}>
            <SentimentHeader />

            {/* Config propio candidato */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                        {ownHandle
                            ? `Tu candidato: @${ownHandle}`
                            : 'Podés agregar tu propio candidato para comparar'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!showOwnForm && (
                            <button
                                onClick={() => {
                                    setShowOwnForm(true)
                                    setOwnInput(ownHandle)
                                    setOwnNameInput(ownName)
                                }}
                                style={{
                                    fontSize: '0.825rem',
                                    color: '#7C3AED',
                                    background: 'rgba(124,58,237,0.06)',
                                    border: '1px solid rgba(124,58,237,0.18)',
                                    borderRadius: 6,
                                    padding: '0.15rem 0.5rem',
                                    cursor: 'pointer',
                                }}
                            >
                                {ownHandle ? 'Cambiar' : '+ Agregar mi candidato'}
                            </button>
                        )}
                        {ownHandle && !showOwnForm && (
                            <button
                                onClick={clearOwnCandidate}
                                style={{
                                    fontSize: '0.825rem',
                                    color: '#f87171',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.15rem 0.5rem',
                                }}
                            >
                                Quitar
                            </button>
                        )}
                    </div>
                </div>

                {showOwnForm && (
                    <div
                        style={{
                            padding: '0.75rem',
                            borderRadius: 8,
                            background: 'rgba(124,58,237,0.04)',
                            border: '1px solid rgba(124,58,237,0.18)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            marginBottom: '0.75rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.5rem',
                            }}
                        >
                            <div>
                                <label
                                    htmlFor="own-handle-input"
                                    style={{
                                        fontSize: '0.8rem',
                                        color: '#A78BFA',
                                        display: 'block',
                                        marginBottom: 2,
                                    }}
                                >
                                    Handle *
                                </label>
                                <input
                                    id="own-handle-input"
                                    type="text"
                                    value={ownInput}
                                    onChange={(e) => setOwnInput(e.target.value)}
                                    placeholder="@tuhandle"
                                    style={{
                                        width: '100%',
                                        padding: '0.3rem 0.45rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(124,58,237,0.25)',
                                        background: '#0A0E1A',
                                        color: '#fff',
                                        fontSize: '0.925rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="own-name-input"
                                    style={{
                                        fontSize: '0.8rem',
                                        color: '#A78BFA',
                                        display: 'block',
                                        marginBottom: 2,
                                    }}
                                >
                                    Nombre
                                </label>
                                <input
                                    id="own-name-input"
                                    type="text"
                                    value={ownNameInput}
                                    onChange={(e) => setOwnNameInput(e.target.value)}
                                    placeholder="Juan Pérez"
                                    style={{
                                        width: '100%',
                                        padding: '0.3rem 0.45rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(124,58,237,0.25)',
                                        background: '#0A0E1A',
                                        color: '#fff',
                                        fontSize: '0.925rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                                onClick={saveOwnCandidate}
                                disabled={!ownInput.trim()}
                                style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: 6,
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    opacity: !ownInput.trim() ? 0.5 : 1,
                                }}
                            >
                                Guardar
                            </button>
                            <button
                                onClick={() => setShowOwnForm(false)}
                                style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: 6,
                                    fontSize: '0.875rem',
                                    background: 'transparent',
                                    border: '1px solid #1e2540',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mi candidato primero */}
            {ownHandle && (
                <PoliticianGroup
                    handle={ownHandle}
                    displayName={ownName || ownHandle}
                    countryCode={ownCountry}
                    handleType="own"
                    topics={topics}
                    defaultOpen={true}
                />
            )}

            {/* Rivales */}
            {rivalMonitors.map((monitor) => (
                <PoliticianGroup
                    key={monitor.id}
                    handle={monitor.handle}
                    displayName={monitor.fullName ?? monitor.handle}
                    countryCode={monitor.country ?? 'ar'}
                    handleType="rival"
                    topics={topics}
                    defaultOpen={true}
                />
            ))}
        </div>
    )
}

// ─── Header reutilizable ──────────────────────────────────

function SentimentHeader() {
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h2
                style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0,
                }}
            >
                Termómetro de Opinión Pública
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.925rem', marginTop: '0.3rem' }}>
                Sentimiento multi-fuente (Twitter, Reddit, YouTube) por político y tema. Cada tema
                se analiza por separado con detección de bots y campañas coordinadas.
            </p>
        </div>
    )
}
