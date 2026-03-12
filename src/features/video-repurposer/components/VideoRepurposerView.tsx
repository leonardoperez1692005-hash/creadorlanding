'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Video,
    Loader2,
    AlertCircle,
    Sparkles,
    Search,
    CalendarDays,
    RotateCcw,
    Scissors,
} from 'lucide-react'
import { useVideoRepurposerStore } from '../store/videoRepurposerStore'
import { useIntelligenceStore } from '@/features/political-intel/store/intelligenceStore'
import { rewritePostAction } from '../actions'
import type { SocialPost } from '@/features/attack-plan/types'
import { MomentsList } from './MomentsList'
import { SocialCalendarGrid } from '@/features/attack-plan/components/SocialCalendarGrid'

export function VideoRepurposerView() {
    const phase = useVideoRepurposerStore((s) => s.phase)
    const error = useVideoRepurposerStore((s) => s.error)
    const videoUrl = useVideoRepurposerStore((s) => s.videoUrl)
    const speakerHint = useVideoRepurposerStore((s) => s.speakerHint)
    const analysis = useVideoRepurposerStore((s) => s.analysis)
    const calendar = useVideoRepurposerStore((s) => s.calendar)
    const setVideoUrl = useVideoRepurposerStore((s) => s.setVideoUrl)
    const setSpeakerHint = useVideoRepurposerStore((s) => s.setSpeakerHint)
    const processVideo = useVideoRepurposerStore((s) => s.processVideo)
    const generateCalendar = useVideoRepurposerStore((s) => s.generateCalendar)
    const updateCalendarPost = useVideoRepurposerStore((s) => s.updateCalendarPost)
    const deleteCalendarPost = useVideoRepurposerStore((s) => s.deleteCalendarPost)
    const requestClips = useVideoRepurposerStore((s) => s.requestClips)
    const pollClipStatus = useVideoRepurposerStore((s) => s.pollClipStatus)
    const clipsPhase = useVideoRepurposerStore((s) => s.clipsPhase)
    const clips = useVideoRepurposerStore((s) => s.clips)
    const selectedMoments = useVideoRepurposerStore((s) => s.selectedMoments)
    const reset = useVideoRepurposerStore((s) => s.reset)

    const campaignProfile = useIntelligenceStore((s) => s.campaignProfile)
    const [showTranscript, setShowTranscript] = useState(false)
    const [activeTab, setActiveTab] = useState<'moments' | 'calendar'>('moments')
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Polling for clip status
    const pollFn = useCallback(() => {
        pollClipStatus()
    }, [pollClipStatus])
    useEffect(() => {
        if (clipsPhase === 'polling') {
            pollingRef.current = setInterval(pollFn, 5000)
            return () => {
                if (pollingRef.current) clearInterval(pollingRef.current)
            }
        }
        if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
        }
    }, [clipsPhase, pollFn])

    const isProcessing = phase === 'transcribing' || phase === 'analyzing'
    const isGenerating = phase === 'generating'

    // Auto-switch to calendar tab when calendar is generated
    const hasCalendar = !!calendar
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (hasCalendar) setActiveTab('calendar')
    }, [hasCalendar])
    /* eslint-enable react-hooks/set-state-in-effect */

    const candidateContext = campaignProfile
        ? `Candidato: ${campaignProfile.candidateName} (${campaignProfile.party})
Posiciones: ${campaignProfile.corePositions.map((p) => `${p.issue}: ${p.position}`).join('; ')}
Propuestas: ${campaignProfile.keyProposals.map((p) => p.title).join(', ')}
Estilo: ${campaignProfile.communicationStyle}`
        : undefined

    const phaseLabels: Record<string, string> = {
        transcribing: 'Obteniendo transcripción y analizando momentos virales...',
        analyzing: 'Detectando momentos virales...',
        generating: 'Generando calendario de contenido...',
    }

    // ─── Idle State ──────────────────────────────────────
    if (phase === 'idle' && !analysis) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem 2rem',
                    flex: 1,
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'rgba(124,58,237,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.25rem',
                    }}
                >
                    <Video size={32} color="#7C3AED" />
                </div>
                <h3
                    style={{
                        color: '#fff',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        margin: '0 0 0.5rem',
                    }}
                >
                    Video Repurposer
                </h3>
                <p
                    style={{
                        color: '#8b9ec7',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        maxWidth: 520,
                        margin: '0 0 1.5rem',
                        lineHeight: 1.6,
                    }}
                >
                    Pegá una URL de YouTube de un rival (entrevista, discurso, debate). El sistema
                    obtiene la transcripción, detecta los momentos más virales, y genera un
                    calendario de contenido para tus redes.
                </p>

                {/* URL Input */}
                <div style={{ width: '100%', maxWidth: 520, marginBottom: '0.75rem' }}>
                    <label
                        htmlFor="video-url-input"
                        style={{
                            color: '#8b9ec7',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'block',
                            marginBottom: '0.25rem',
                        }}
                    >
                        URL de YouTube
                    </label>
                    <input
                        id="video-url-input"
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        style={{
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.03)',
                            color: '#fff',
                            fontSize: '0.85rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Speaker Hint */}
                <div style={{ width: '100%', maxWidth: 520, marginBottom: '1.25rem' }}>
                    <label
                        htmlFor="speaker-hint-input"
                        style={{
                            color: '#8b9ec7',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'block',
                            marginBottom: '0.25rem',
                        }}
                    >
                        Orador (opcional)
                    </label>
                    <input
                        id="speaker-hint-input"
                        type="text"
                        value={speakerHint}
                        onChange={(e) => setSpeakerHint(e.target.value)}
                        placeholder="Ej: Nombre del político rival"
                        style={{
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.03)',
                            color: '#fff',
                            fontSize: '0.85rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Campaign profile status */}
                <div
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        marginBottom: '1rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: campaignProfile
                            ? 'rgba(52,211,153,0.08)'
                            : 'rgba(251,191,36,0.08)',
                        border: `1px solid ${campaignProfile ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                        fontSize: '0.75rem',
                        color: campaignProfile ? '#34D399' : '#FBBF24',
                    }}
                >
                    {campaignProfile
                        ? `Perfil activo: ${campaignProfile.candidateName} (${campaignProfile.party}) — El análisis contrastará con tus posiciones.`
                        : 'Sin perfil de campaña configurado. El análisis será genérico, sin contraste con tu candidato. Configurá el perfil en la pestaña "Campaña".'}
                </div>

                {error && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#F87171',
                            fontSize: '0.8rem',
                            marginBottom: '1rem',
                        }}
                    >
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <button
                    onClick={() => processVideo(candidateContext)}
                    disabled={!videoUrl}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        background: videoUrl
                            ? 'linear-gradient(135deg, #7C3AED 0%, #00C8FF 100%)'
                            : 'rgba(255,255,255,0.1)',
                        opacity: videoUrl ? 1 : 0.5,
                    }}
                >
                    <Search size={18} />
                    Analizar Video
                </button>
            </div>
        )
    }

    // ─── Processing State ────────────────────────────────
    if (isProcessing || isGenerating) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 2rem',
                    flex: 1,
                }}
            >
                <Loader2
                    size={40}
                    color="#7C3AED"
                    style={{ animation: 'spin 1s linear infinite', marginBottom: '1.25rem' }}
                />
                <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                    {phaseLabels[phase] ?? 'Procesando...'}
                </p>
                <p style={{ color: '#8b9ec7', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Esto puede tardar 1-3 minutos según la duración del video.
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // ─── Error State ─────────────────────────────────────
    if (phase === 'error') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 2rem',
                    flex: 1,
                }}
            >
                <AlertCircle size={40} color="#F87171" style={{ marginBottom: '1rem' }} />
                <p style={{ color: '#F87171', fontSize: '0.9rem', fontWeight: 600 }}>
                    Error al procesar el video
                </p>
                <p
                    style={{
                        color: '#8b9ec7',
                        fontSize: '0.8rem',
                        marginTop: '0.5rem',
                        textAlign: 'center',
                        maxWidth: 400,
                    }}
                >
                    {error}
                </p>
                <button
                    onClick={reset}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1.5rem',
                        padding: '0.6rem 1.25rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                    }}
                >
                    <RotateCcw size={16} />
                    Intentar de nuevo
                </button>
            </div>
        )
    }

    // ─── Results: Analysis + Calendar ────────────────────
    return (
        <div style={{ padding: '1.5rem', overflow: 'auto' }}>
            {/* Header */}
            {analysis && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    color: '#fff',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    margin: 0,
                                }}
                            >
                                {analysis.video_title}
                            </h3>
                            <p
                                style={{
                                    color: '#8b9ec7',
                                    fontSize: '0.8rem',
                                    margin: '0.25rem 0 0',
                                }}
                            >
                                {analysis.speaker_name} &middot;{' '}
                                {Math.round(analysis.duration_seconds / 60)} min &middot;{' '}
                                {analysis.moments.length} momentos detectados
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => processVideo(candidateContext)}
                                disabled={isProcessing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: 'rgba(124,58,237,0.08)',
                                    color: '#A78BFA',
                                    border: '1px solid rgba(124,58,237,0.2)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                }}
                            >
                                <RotateCcw size={14} />
                                Regenerar Análisis
                            </button>
                            <button
                                onClick={reset}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#8b9ec7',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                }}
                            >
                                Nuevo video
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <p
                        style={{
                            color: '#c0c8dd',
                            fontSize: '0.85rem',
                            lineHeight: 1.6,
                            margin: '0.75rem 0',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            background: 'rgba(124,58,237,0.08)',
                            borderLeft: '3px solid #7C3AED',
                        }}
                    >
                        {analysis.summary}
                    </p>

                    {/* Toggle transcript */}
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        style={{
                            color: '#00c8ff',
                            fontSize: '0.8rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                        }}
                    >
                        {showTranscript
                            ? 'Ocultar transcripción completa'
                            : 'Ver transcripción completa'}
                    </button>

                    {showTranscript && (
                        <pre
                            style={{
                                color: '#8b9ec7',
                                fontSize: '0.75rem',
                                lineHeight: 1.6,
                                margin: '0.75rem 0',
                                padding: '1rem',
                                borderRadius: '8px',
                                background: 'rgba(0,0,0,0.3)',
                                whiteSpace: 'pre-wrap',
                                maxHeight: 400,
                                overflow: 'auto',
                            }}
                        >
                            {analysis.full_transcript}
                        </pre>
                    )}
                </div>
            )}

            {/* Tabs: Momentos / Calendario */}
            {analysis && (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.25rem',
                        marginBottom: '1rem',
                        borderBottom: '1px solid #1e2540',
                        paddingBottom: '0',
                    }}
                >
                    <button
                        onClick={() => setActiveTab('moments')}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: activeTab === 'moments' ? '#A78BFA' : '#6B7280',
                            borderBottom:
                                activeTab === 'moments'
                                    ? '2px solid #A78BFA'
                                    : '2px solid transparent',
                            marginBottom: '-1px',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Scissors size={14} />
                            Momentos
                            {clips.length > 0
                                ? ` (${clips.filter((c) => c.status === 'ready').length}/${clips.length} clips)`
                                : ` (${analysis.moments.length})`}
                        </span>
                    </button>
                    <button
                        onClick={() =>
                            calendar
                                ? setActiveTab('calendar')
                                : generateCalendar(campaignProfile?.candidateName, candidateContext)
                        }
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: activeTab === 'calendar' ? '#00c8ff' : '#6B7280',
                            borderBottom:
                                activeTab === 'calendar'
                                    ? '2px solid #00c8ff'
                                    : '2px solid transparent',
                            marginBottom: '-1px',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CalendarDays size={14} />
                            {calendar ? 'Calendario' : 'Generar Calendario'}
                        </span>
                    </button>
                </div>
            )}

            {/* Moments Tab */}
            {analysis && activeTab === 'moments' && (
                <>
                    <MomentsList />
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            margin: '1.5rem 0',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* Cut Clips button */}
                        <button
                            onClick={requestClips}
                            disabled={
                                clipsPhase === 'cutting' ||
                                clipsPhase === 'polling' ||
                                selectedMoments.length === 0
                            }
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                background:
                                    clipsPhase === 'cutting' || clipsPhase === 'polling'
                                        ? 'rgba(255,255,255,0.1)'
                                        : 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                                opacity: selectedMoments.length === 0 ? 0.5 : 1,
                            }}
                        >
                            {clipsPhase === 'cutting' ? (
                                <Loader2
                                    size={18}
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />
                            ) : clipsPhase === 'polling' ? (
                                <Loader2
                                    size={18}
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />
                            ) : (
                                <Scissors size={18} />
                            )}
                            {clipsPhase === 'cutting'
                                ? 'Enviando a Shotstack...'
                                : clipsPhase === 'polling'
                                  ? `Cortando ${clips.filter((c) => c.status === 'processing').length} clips...`
                                  : clipsPhase === 'complete'
                                    ? `${clips.filter((c) => c.status === 'ready').length}/${clips.length} clips listos`
                                    : `Cortar Clips (${selectedMoments.length})`}
                        </button>

                        {/* Generate Calendar button */}
                        {!calendar && (
                            <button
                                onClick={() =>
                                    generateCalendar(
                                        campaignProfile?.candidateName,
                                        candidateContext,
                                    )
                                }
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #00C8FF 0%, #7C3AED 100%)',
                                }}
                            >
                                <CalendarDays size={18} />
                                Generar Calendario de Contenido
                            </button>
                        )}
                    </div>

                    {/* Clip errors */}
                    {clipsPhase === 'error' && error && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#F87171',
                                fontSize: '0.8rem',
                                justifyContent: 'center',
                                marginBottom: '1rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                background: 'rgba(248,113,113,0.08)',
                                border: '1px solid rgba(248,113,113,0.2)',
                                maxWidth: '600px',
                                margin: '0 auto 1rem',
                            }}
                        >
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}
                    {clipsPhase === 'complete' &&
                        clips.length > 0 &&
                        clips.every((c) => c.status === 'error') && (
                            <div
                                style={{
                                    color: '#F87171',
                                    fontSize: '0.8rem',
                                    textAlign: 'center',
                                    marginBottom: '1rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: 'rgba(248,113,113,0.08)',
                                    border: '1px solid rgba(248,113,113,0.2)',
                                    maxWidth: '600px',
                                    margin: '0 auto 1rem',
                                }}
                            >
                                <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>
                                    Todos los clips fallaron
                                </p>
                                <p style={{ margin: 0, color: '#f8717199' }}>
                                    {clips[0]?.error ??
                                        'Error desconocido. Revisá la consola del servidor para más detalles.'}
                                </p>
                            </div>
                        )}
                </>
            )}

            {/* Calendar Tab */}
            {calendar && activeTab === 'calendar' && (
                <div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={20} color="#00c8ff" />
                            <h3
                                style={{
                                    color: '#fff',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    margin: 0,
                                }}
                            >
                                {calendar.weeklyTheme}
                            </h3>
                        </div>
                        <button
                            onClick={() =>
                                generateCalendar(campaignProfile?.candidateName, candidateContext)
                            }
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.45rem 0.9rem',
                                borderRadius: '6px',
                                background: 'rgba(0,200,255,0.08)',
                                color: '#00c8ff',
                                border: '1px solid rgba(0,200,255,0.15)',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                            }}
                        >
                            <RotateCcw size={13} />
                            Regenerar
                        </button>
                    </div>

                    <SocialCalendarGrid
                        days={calendar.days}
                        onEditPost={(dayIndex, postIndex, updated) =>
                            updateCalendarPost(dayIndex, postIndex, updated)
                        }
                        onDeletePost={(dayIndex, postIndex) =>
                            deleteCalendarPost(dayIndex, postIndex)
                        }
                        onRewritePost={async (dayIndex, postIndex, instructions) => {
                            const post = calendar.days[dayIndex]?.posts[postIndex]
                            if (!post) return null
                            const result = await rewritePostAction({ post, instructions })
                            if (result.success) {
                                updateCalendarPost(dayIndex, postIndex, result.data as SocialPost)
                                return result.data as SocialPost
                            }
                            return null
                        }}
                    />

                    {calendar.tips.length > 0 && (
                        <div
                            style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                borderRadius: '8px',
                                background: 'rgba(0,200,255,0.05)',
                                border: '1px solid rgba(0,200,255,0.15)',
                            }}
                        >
                            <h4
                                style={{
                                    color: '#00c8ff',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    margin: '0 0 0.5rem',
                                }}
                            >
                                Tips Estratégicos
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                {calendar.tips.map((tip, i) => (
                                    <li
                                        key={i}
                                        style={{
                                            color: '#8b9ec7',
                                            fontSize: '0.8rem',
                                            lineHeight: 1.5,
                                            marginBottom: '0.25rem',
                                        }}
                                    >
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
