'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import {
    analyzeSentimentAction,
    getSentimentHistoryAction,
    type SentimentSnapshot,
} from '../actions/sentiment'

// ─── Mini trend bar ───────────────────────────────────────

function TrendBar({ snapshots }: { snapshots: SentimentSnapshot[] }) {
    if (snapshots.length < 2) return null

    const recent = snapshots.slice(-14) // last 14 days

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
                        gap: 1,
                        height: '100%',
                        justifyContent: 'flex-end',
                    }}
                >
                    {/* Stacked bar: positive (green) on top, negative (red) on bottom */}
                    <div
                        style={{
                            width: '100%',
                            background: `linear-gradient(to top, rgba(248,113,113,0.7) ${s.negativePct}%, rgba(52,211,153,0.7) ${s.negativePct}%)`,
                            height: `${Math.max(s.positivePct + s.negativePct, 10)}%`,
                            borderRadius: 2,
                            minHeight: 4,
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

// ─── Single thermometer card ──────────────────────────────

function ThermometerCard({
    handle,
    displayName,
    topics,
    countryCode,
    handleType = 'rival',
}: {
    handle: string
    displayName: string
    topics: string[]
    countryCode: string
    handleType?: 'rival' | 'own'
}) {
    const [snapshots, setSnapshots] = useState<SentimentSnapshot[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showOrganic, setShowOrganic] = useState(false)

    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

    // Toggle helpers
    const hasBotData = !!(latest && latest.botInflationPct > 0)
    const displayPositive =
        showOrganic && hasBotData ? latest!.organicPositivePct : (latest?.positivePct ?? 0)
    const displayNegative =
        showOrganic && hasBotData ? latest!.organicNegativePct : (latest?.negativePct ?? 0)
    const displayNeutral =
        showOrganic && hasBotData
            ? Math.max(0, 100 - latest!.organicPositivePct - latest!.organicNegativePct)
            : (latest?.neutralPct ?? 0)

    const loadHistory = useCallback(async () => {
        const res = await getSentimentHistoryAction(handle)
        if (res.success) setSnapshots(res.data)
    }, [handle])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch on mount
        loadHistory()
    }, [loadHistory])

    async function handleAnalyze() {
        if (topics.length === 0) {
            setError('Agregá temas en Análisis Temático primero')
            return
        }
        setLoading(true)
        setError(null)
        const res = await analyzeSentimentAction(
            handle,
            displayName,
            topics,
            countryCode,
            handleType,
        )
        if (res.success) {
            setSnapshots((prev) => {
                // Replace or add the new snapshot
                const filtered = prev.filter((s) => s.snapshotDate !== res.data.snapshotDate)
                return [...filtered, res.data].sort((a, b) =>
                    a.snapshotDate.localeCompare(b.snapshotDate),
                )
            })
        } else {
            setError(res.error)
        }
        setLoading(false)
    }

    // Trend: compare last two snapshots
    const prevSnap = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null
    const positiveTrend = latest && prevSnap ? latest.positivePct - prevSnap.positivePct : null

    return (
        <div
            style={{
                background:
                    handleType === 'own' ? 'rgba(124,58,237,0.05)' : 'rgba(255,255,255,0.03)',
                border:
                    handleType === 'own'
                        ? '1px solid rgba(124,58,237,0.25)'
                        : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '1rem',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>
                            {displayName}
                        </div>
                        {handleType === 'own' && (
                            <span
                                style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    color: '#7C3AED',
                                    background: 'rgba(124,58,237,0.12)',
                                    border: '1px solid rgba(124,58,237,0.25)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '10px',
                                }}
                            >
                                MI CANDIDATO
                            </span>
                        )}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>@{handle}</div>
                    {topics.length > 0 && (
                        <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: 2 }}>
                            {topics.join(' · ')}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={loading || topics.length === 0}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.3rem 0.6rem',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: 'rgba(0,200,255,0.1)',
                        border: '1px solid rgba(0,200,255,0.25)',
                        color: '#00c8ff',
                        cursor: loading || topics.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: topics.length === 0 ? 0.4 : 1,
                    }}
                >
                    <RefreshCw
                        size={11}
                        style={loading ? { animation: 'spin 1s linear infinite' } : {}}
                    />
                    {loading ? 'Analizando...' : latest ? 'Actualizar' : 'Analizar'}
                </button>
            </div>

            {error && (
                <div style={{ color: '#f87171', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                    {error}
                </div>
            )}

            {latest ? (
                <>
                    {/* Total / Orgánico toggle — solo si hay datos de bots */}
                    {hasBotData && (
                        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.6rem' }}>
                            <button
                                onClick={() => setShowOrganic(false)}
                                style={{
                                    padding: '0.15rem 0.6rem',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem',
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
                                    padding: '0.15rem 0.6rem',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem',
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
                                    gap: '0.25rem',
                                }}
                            >
                                <Bot size={10} /> Orgánico
                            </button>
                            {showOrganic && (
                                <span
                                    style={{
                                        fontSize: '0.68rem',
                                        color: '#475569',
                                        alignSelf: 'center',
                                        marginLeft: 4,
                                    }}
                                >
                                    sin ~{latest.botInflationPct}% bots estimados
                                </span>
                            )}
                        </div>
                    )}

                    {/* Main thermometer bar */}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <div
                            style={{
                                display: 'flex',
                                height: 20,
                                borderRadius: 10,
                                overflow: 'hidden',
                                gap: 2,
                            }}
                        >
                            <div
                                title={`Positivo: ${displayPositive}%`}
                                style={{
                                    width: `${displayPositive}%`,
                                    background: 'rgba(52,211,153,0.8)',
                                    transition: 'width 0.5s ease',
                                    minWidth: displayPositive > 0 ? 4 : 0,
                                }}
                            />
                            <div
                                title={`Neutral: ${displayNeutral}%`}
                                style={{
                                    width: `${displayNeutral}%`,
                                    background: 'rgba(100,116,139,0.6)',
                                    minWidth: displayNeutral > 0 ? 4 : 0,
                                    transition: 'width 0.5s ease',
                                }}
                            />
                            <div
                                title={`Negativo: ${displayNegative}%`}
                                style={{
                                    width: `${displayNegative}%`,
                                    background: 'rgba(248,113,113,0.8)',
                                    minWidth: displayNegative > 0 ? 4 : 0,
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        </div>

                        {/* Legend */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.75rem',
                                marginTop: '0.4rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '0.72rem',
                                    color: '#34d399',
                                }}
                            >
                                <ThumbsUp size={10} />
                                {displayPositive}% a favor
                            </span>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '0.72rem',
                                    color: '#64748b',
                                }}
                            >
                                <Minus size={10} />
                                {displayNeutral}%
                            </span>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '0.72rem',
                                    color: '#f87171',
                                }}
                            >
                                <ThumbsDown size={10} />
                                {displayNegative}% en contra
                            </span>
                            {positiveTrend !== null && !showOrganic && (
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        fontSize: '0.7rem',
                                        color: positiveTrend >= 0 ? '#34d399' : '#f87171',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    {positiveTrend >= 0 ? (
                                        <TrendingUp size={10} />
                                    ) : (
                                        <TrendingDown size={10} />
                                    )}
                                    {positiveTrend > 0 ? '+' : ''}
                                    {positiveTrend}% vs ayer
                                </span>
                            )}
                            {showOrganic && hasBotData && (
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        fontSize: '0.7rem',
                                        color: '#64748b',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    vs total: {latest.positivePct}% / {latest.negativePct}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bot badges + campaña coordinada */}
                    {latest.botInflationPct > 0 && (
                        <div
                            style={{
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontSize: '0.7rem',
                                    color: '#94a3b8',
                                    background: 'rgba(100,116,139,0.1)',
                                    border: '1px solid rgba(100,116,139,0.2)',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '20px',
                                }}
                            >
                                <Bot size={10} />~{latest.botInflationPct}% posibles bots
                            </span>
                            {latest.coordinatedCampaign && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        fontSize: '0.7rem',
                                        color: '#FBBF24',
                                        background: 'rgba(251,191,36,0.08)',
                                        border: '1px solid rgba(251,191,36,0.2)',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '20px',
                                    }}
                                >
                                    <AlertTriangle size={10} />
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

                    {/* Summary */}
                    {latest.summary && (
                        <p
                            style={{
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                                marginBottom: '0.75rem',
                                lineHeight: 1.5,
                            }}
                        >
                            {latest.summary}
                        </p>
                    )}

                    {/* Themes */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {latest.keyPositiveThemes.length > 0 && (
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: '#34d399',
                                        marginBottom: 4,
                                        fontWeight: 600,
                                    }}
                                >
                                    LO APOYA POR
                                </div>
                                {latest.keyPositiveThemes.slice(0, 3).map((t, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            fontSize: '0.7rem',
                                            color: '#94a3b8',
                                            padding: '1px 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
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
                                        fontSize: '0.65rem',
                                        color: '#f87171',
                                        marginBottom: 4,
                                        fontWeight: 600,
                                    }}
                                >
                                    LO CRITICA POR
                                </div>
                                {latest.keyNegativeThemes.slice(0, 3).map((t, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            fontSize: '0.7rem',
                                            color: '#94a3b8',
                                            padding: '1px 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <span style={{ color: '#f87171' }}>−</span> {t}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Trend chart */}
                    {snapshots.length >= 2 && (
                        <div>
                            <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 2 }}>
                                Evolución (últimos {snapshots.length} días)
                            </div>
                            <TrendBar snapshots={snapshots} />
                        </div>
                    )}

                    {/* Sample comments (collapsible) */}
                    {latest.sampleComments.length > 0 && (
                        <details style={{ marginTop: '0.75rem' }}>
                            <summary
                                style={{
                                    fontSize: '0.7rem',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <MessageSquare size={10} />
                                Ver comentarios de muestra ({latest.sampleComments.length})
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
                                        <Bot size={10} />
                                        {
                                            latest.sampleComments.filter((c) => c.isLikelyBot)
                                                .length
                                        }{' '}
                                        sospechosos
                                    </span>
                                )}
                            </summary>
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                {latest.sampleComments.map((c, i) => (
                                    <div
                                        key={i}
                                        title={
                                            c.isLikelyBot && c.botSignal
                                                ? `🤖 ${c.botSignal}`
                                                : undefined
                                        }
                                        style={{
                                            padding: '0.4rem 0.5rem',
                                            borderRadius: 6,
                                            fontSize: '0.72rem',
                                            color: c.isLikelyBot ? '#64748b' : '#94a3b8',
                                            opacity: c.isLikelyBot ? 0.65 : 1,
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
                                            gap: '0.35rem',
                                        }}
                                    >
                                        {c.isLikelyBot && (
                                            <Bot
                                                size={11}
                                                style={{
                                                    flexShrink: 0,
                                                    marginTop: 1,
                                                    color: '#475569',
                                                }}
                                            />
                                        )}
                                        <span>{c.text}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}

                    <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.5rem' }}>
                        Muestra: ~{latest.totalAnalyzed} opiniones · {latest.snapshotDate}
                    </div>
                </>
            ) : (
                <div
                    style={{
                        textAlign: 'center',
                        color: '#475569',
                        fontSize: '0.8rem',
                        padding: '1.5rem 0',
                    }}
                >
                    {topics.length === 0
                        ? 'Agregá temas para analizar el sentimiento'
                        : 'Presioná "Analizar" para medir la opinión pública'}
                </div>
            )}
        </div>
    )
}

// ─── Main panel ───────────────────────────────────────────

const OWN_HANDLE_KEY = 'political-intel:own-handle'
const OWN_NAME_KEY = 'political-intel:own-name'
const OWN_COUNTRY_KEY = 'political-intel:own-country'

export function SentimentPanel() {
    const { monitors, campaignProfile } = useIntelligenceStore()
    const [activeTopics, setActiveTopics] = useState<Array<{ name: string }>>([])

    // Own candidate handle (persisted in localStorage)
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

    // Pre-fill from campaign profile if available and not yet set
    useEffect(() => {
        if (campaignProfile && !ownHandle && campaignProfile.candidateName) {
            setOwnNameInput(campaignProfile.candidateName)
            setOwnCountry(campaignProfile.country ?? 'ar')
        }
    }, [campaignProfile, ownHandle])

    // Load active topics once
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

    if (monitors.length === 0 && !ownHandle) {
        return (
            <div style={{ color: '#475569', textAlign: 'center', padding: '3rem 1rem' }}>
                Agregá rivales en la sección Monitors para medir su sentimiento público.
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2
                    style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <span style={{ color: '#00c8ff' }}>📊</span>
                    Termómetro de Opinión Pública
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Sentimiento de Twitter/X por rival y tema. Se actualiza bajo demanda. Los datos
                    reflejan menciones y reacciones públicas scrapeadas en tiempo real.
                </p>
            </div>

            {/* Mi candidato section */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7C3AED' }}>
                        MI CANDIDATO
                    </span>
                    {!ownHandle && !showOwnForm && (
                        <button
                            onClick={() => setShowOwnForm(true)}
                            style={{
                                fontSize: '0.72rem',
                                color: '#7C3AED',
                                background: 'rgba(124,58,237,0.08)',
                                border: '1px solid rgba(124,58,237,0.2)',
                                borderRadius: 6,
                                padding: '0.2rem 0.6rem',
                                cursor: 'pointer',
                            }}
                        >
                            + Agregar mi handle
                        </button>
                    )}
                    {ownHandle && (
                        <button
                            onClick={() => {
                                setShowOwnForm(true)
                                setOwnInput(ownHandle)
                                setOwnNameInput(ownName)
                            }}
                            style={{
                                fontSize: '0.7rem',
                                color: '#475569',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                            }}
                        >
                            Cambiar
                        </button>
                    )}
                </div>

                {showOwnForm && (
                    <div
                        style={{
                            padding: '0.75rem',
                            borderRadius: 8,
                            marginBottom: '0.75rem',
                            background: 'rgba(124,58,237,0.05)',
                            border: '1px solid rgba(124,58,237,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
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
                                    htmlFor="st-own-handle"
                                    style={{
                                        fontSize: '0.68rem',
                                        color: '#A78BFA',
                                        display: 'block',
                                        marginBottom: 2,
                                    }}
                                >
                                    Handle *
                                </label>
                                <input
                                    id="st-own-handle"
                                    type="text"
                                    value={ownInput}
                                    onChange={(e) => setOwnInput(e.target.value)}
                                    placeholder="@mihandle"
                                    style={{
                                        width: '100%',
                                        padding: '0.35rem 0.5rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(124,58,237,0.3)',
                                        background: '#0A0E1A',
                                        color: '#fff',
                                        fontSize: '0.8rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="st-own-name"
                                    style={{
                                        fontSize: '0.68rem',
                                        color: '#A78BFA',
                                        display: 'block',
                                        marginBottom: 2,
                                    }}
                                >
                                    Nombre
                                </label>
                                <input
                                    id="st-own-name"
                                    type="text"
                                    value={ownNameInput}
                                    onChange={(e) => setOwnNameInput(e.target.value)}
                                    placeholder="Juan Pérez"
                                    style={{
                                        width: '100%',
                                        padding: '0.35rem 0.5rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(124,58,237,0.3)',
                                        background: '#0A0E1A',
                                        color: '#fff',
                                        fontSize: '0.8rem',
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
                                    fontSize: '0.75rem',
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
                                    fontSize: '0.75rem',
                                    background: 'transparent',
                                    border: '1px solid #1e2540',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            {ownHandle && (
                                <button
                                    onClick={clearOwnCandidate}
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: 6,
                                        fontSize: '0.75rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#f87171',
                                        cursor: 'pointer',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    Quitar
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {ownHandle && !showOwnForm && (
                    <ThermometerCard
                        handle={ownHandle}
                        displayName={ownName || ownHandle}
                        topics={topics}
                        countryCode={ownCountry}
                        handleType="own"
                    />
                )}

                {!ownHandle && !showOwnForm && (
                    <div
                        style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 8,
                            background: 'rgba(124,58,237,0.04)',
                            border: '1px dashed rgba(124,58,237,0.2)',
                            color: '#64748b',
                            fontSize: '0.78rem',
                            textAlign: 'center',
                        }}
                    >
                        Agregá tu handle para medir tu propio sentimiento público y compararlo con
                        los rivales.
                    </div>
                )}
            </div>

            {/* Rivals */}
            {monitors.length > 0 && (
                <>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#64748b',
                            marginBottom: '0.5rem',
                        }}
                    >
                        RIVALES
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '1rem',
                        }}
                    >
                        {monitors.map((monitor) => (
                            <ThermometerCard
                                key={monitor.id}
                                handle={monitor.handle}
                                displayName={monitor.fullName ?? monitor.handle}
                                topics={topics}
                                countryCode={monitor.country ?? 'ar'}
                                handleType="rival"
                            />
                        ))}
                    </div>
                </>
            )}

            {topics.length === 0 && (
                <div
                    style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 8,
                        background: 'rgba(251,191,36,0.08)',
                        border: '1px solid rgba(251,191,36,0.2)',
                        color: '#FBBF24',
                        fontSize: '0.8rem',
                    }}
                >
                    ⚠️ Agregá temas en <strong>Análisis Temático</strong> para que el termómetro
                    analice sentimiento específico por tema.
                </div>
            )}
        </div>
    )
}
