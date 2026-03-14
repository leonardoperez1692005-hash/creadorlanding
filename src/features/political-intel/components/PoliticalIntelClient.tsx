'use client'

import { useEffect, useCallback } from 'react'
import {
    Radar,
    Shield,
    Users,
    BarChart3,
    Crosshair,
    CalendarDays,
    Layout,
    Clock,
    BookOpen,
    Video,
    Film,
    ImagePlus,
    Brain,
} from 'lucide-react'
import { useIntelligenceStore, type IntelligenceView } from '../store/intelligenceStore'
import { useVideoRepurposerStore } from '@/features/video-repurposer/store/videoRepurposerStore'

const VALID_VIEWS = new Set<IntelligenceView>([
    'command-center',
    'campaign-profile',
    'monitors',
    'thematic',
    'dashboard',
    'attack-vectors',
    'calendar',
    'landing',
    'video-repurposer',
    'image-studio',
])

// Restore view from URL hash BEFORE first render (module-level, runs once on import)
if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '') as IntelligenceView
    if (hash && VALID_VIEWS.has(hash)) {
        useIntelligenceStore.setState({ currentView: hash })
    }
}
import type { PoliticalMonitor, PoliticalReportHistoryItem } from '../types'
import { CampaignProfileForm } from './CampaignProfileForm'
import { MonitorConfigPanel } from './MonitorConfigPanel'
import { PoliticalDashboard } from './PoliticalDashboard'
import { AttackVectorsPanel } from './AttackVectorsPanel'
import { PoliticalCalendarView } from './PoliticalCalendarView'
import { PoliticalLandingPanel } from './PoliticalLandingPanel'
import { ThematicIntelPanel } from './ThematicIntelPanel'
import { VideoRepurposerView } from '@/features/video-repurposer/components/VideoRepurposerView'
import { ImageStudioView } from '@/features/image-studio/components/ImageStudioView'
import { CommandCenter } from './CommandCenter'

interface PoliticalIntelClientProps {
    initialMonitors?: PoliticalMonitor[]
    initialHistory?: PoliticalReportHistoryItem[]
    allowedIntelViews?: string[]
}

export function PoliticalIntelClient({
    initialMonitors,
    initialHistory,
    allowedIntelViews,
}: PoliticalIntelClientProps) {
    // If no allowedIntelViews, all views are allowed (superadmin or legacy)
    const isViewAllowed = (view: string) => !allowedIntelViews || allowedIntelViews.includes(view)
    const {
        currentView,
        setView,
        campaignProfile,
        campaignProfileLoaded,
        monitors,
        history,
        report,
        phase,
        attackVectors,
        thematicAngles,
        loadCampaignProfile,
        loadMonitors,
        loadHistory,
        loadReport,
        loadThematicReport,
        loadTopics,
        loadCalendar,
        setActiveTopic,
        // activeTopicId used elsewhere
    } = useIntelligenceStore()

    // Sync URL hash when view changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `#${currentView}`)
        }
    }, [currentView])

    // Initialize data
    useEffect(() => {
        loadCampaignProfile()

        if (initialMonitors && initialMonitors.length > 0) {
            useIntelligenceStore.setState({ monitors: initialMonitors })
        } else {
            loadMonitors()
        }

        if (initialHistory && initialHistory.length > 0) {
            useIntelligenceStore.setState({ history: initialHistory })
        }
        // Always load full history from DB (initialHistory may be incomplete)

        loadHistory()

        loadTopics()

        // Load video sessions for sidebar

        useVideoRepurposerStore.getState().loadSessions()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Refresh history when switching views (ensures thematic reports appear)
    useEffect(() => {
        loadHistory()
    }, [currentView]) // eslint-disable-line react-hooks/exhaustive-deps

    // If profile loaded and doesn't exist, force campaign-profile form
    // While loading, respect currentView (avoids flash)
    const profileRequired = campaignProfileLoaded && !campaignProfile
    const effectiveView =
        profileRequired && currentView !== 'campaign-profile' ? 'campaign-profile' : currentView

    const handleHistoryClick = useCallback(
        (item: PoliticalReportHistoryItem & { reportType: string }) => {
            if (item.reportType === 'thematic-calendar') {
                // Virtual calendar entry from thematic report
                const realId = item.id.replace('cal-', '')

                loadCalendar(realId)
                if (item.topicId) setActiveTopic(item.topicId)
                else setActiveTopic(null)
                setView('calendar')
            } else if (item.reportType === 'monitoring-calendar') {
                // Virtual calendar entry from monitoring report
                const realId = item.id.replace('cal-', '')

                loadCalendar(realId)
                setActiveTopic(null)
                setView('calendar')
            } else if (item.reportType === 'landing-thematic') {
                // Landing source from thematic report — load angles, stay on landing

                loadThematicReport(item.id)
            } else if (item.reportType === 'landing-monitoring') {
                // Landing source from monitoring report — load vectors, stay on landing

                loadReport(item.id)
            } else if (item.reportType === 'thematic') {
                loadThematicReport(item.id)
                setView('thematic')
            } else {
                loadReport(item.id)
                setView('dashboard')
            }
        },
        [loadReport, loadThematicReport, loadCalendar, setActiveTopic, setView],
    )

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div
                style={{
                    padding: '1rem 2rem',
                    borderBottom: '1px solid #1e2540',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Radar size={24} color="#00c8ff" />
                    <div>
                        <h1
                            style={{
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                color: '#fff',
                                margin: 0,
                            }}
                        >
                            Intel Política
                        </h1>
                        <p style={{ fontSize: '0.78rem', color: '#8b9ec7', margin: 0 }}>
                            Monitoreo de rivales · Bright Data + Gemini · Multi-país
                        </p>
                    </div>
                </div>

                {/* Nav buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <NavBtn
                        icon={Brain}
                        label="Centro"
                        active={effectiveView === 'command-center'}
                        onClick={() => setView('command-center')}
                        color="#00c8ff"
                    />
                    {isViewAllowed('campaign-profile') && (
                        <NavBtn
                            icon={Shield}
                            label="Campaña"
                            active={effectiveView === 'campaign-profile'}
                            onClick={() => setView('campaign-profile')}
                            color="#7C3AED"
                        />
                    )}
                    {isViewAllowed('monitors') && (
                        <NavBtn
                            icon={Users}
                            label="Monitors"
                            active={effectiveView === 'monitors'}
                            onClick={() => setView('monitors')}
                            color="#00c8ff"
                            badge={monitors.length > 0 ? String(monitors.length) : undefined}
                            disabled={profileRequired}
                        />
                    )}
                    {isViewAllowed('thematic') && (
                        <NavBtn
                            icon={BookOpen}
                            label="Temas"
                            active={effectiveView === 'thematic'}
                            onClick={() => setView('thematic')}
                            color="#10B981"
                            disabled={profileRequired}
                        />
                    )}
                    {isViewAllowed('dashboard') && (
                        <NavBtn
                            icon={BarChart3}
                            label="Dashboard"
                            active={effectiveView === 'dashboard'}
                            onClick={() => setView('dashboard')}
                            color="#34D399"
                            disabled={profileRequired || !report}
                        />
                    )}
                    {isViewAllowed('attack-vectors') && (
                        <NavBtn
                            icon={Crosshair}
                            label="Ataques"
                            active={effectiveView === 'attack-vectors'}
                            onClick={() => setView('attack-vectors')}
                            color="#F87171"
                            disabled={profileRequired || !report}
                        />
                    )}
                    {isViewAllowed('calendar') && (
                        <NavBtn
                            icon={CalendarDays}
                            label="Calendario"
                            active={effectiveView === 'calendar'}
                            onClick={() => setView('calendar')}
                            color="#00c8ff"
                            disabled={
                                profileRequired ||
                                (attackVectors.length === 0 &&
                                    thematicAngles.length === 0 &&
                                    !history.some((h) => h.hasCalendar))
                            }
                        />
                    )}
                    {isViewAllowed('landing') && (
                        <NavBtn
                            icon={Layout}
                            label="Landing"
                            active={effectiveView === 'landing'}
                            onClick={() => setView('landing')}
                            color="#7C3AED"
                            disabled={
                                profileRequired ||
                                (attackVectors.length === 0 &&
                                    thematicAngles.length === 0 &&
                                    history.length === 0)
                            }
                        />
                    )}
                    {isViewAllowed('video-repurposer') && (
                        <NavBtn
                            icon={Video}
                            label="Video"
                            active={effectiveView === 'video-repurposer'}
                            onClick={() => setView('video-repurposer')}
                            color="#F472B6"
                            disabled={profileRequired}
                        />
                    )}
                    {isViewAllowed('image-studio') && (
                        <NavBtn
                            icon={ImagePlus}
                            label="Imágenes"
                            active={effectiveView === 'image-studio'}
                            onClick={() => setView('image-studio')}
                            color="#F59E0B"
                            disabled={profileRequired}
                        />
                    )}
                    {profileRequired && (
                        <span
                            style={{
                                fontSize: '0.72rem',
                                color: '#F59E0B',
                                marginLeft: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                            }}
                            aria-label="Completá el perfil de campaña para desbloquear las demás secciones"
                        >
                            <Clock size={12} color="#F59E0B" />
                            Guardá tu perfil para desbloquear
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* History Sidebar */}
                <div
                    style={{
                        width: 240,
                        borderRight: '1px solid #1e2540',
                        overflowY: 'auto',
                        flexShrink: 0,
                        padding: '1rem 0',
                    }}
                >
                    <div style={{ padding: '0 1rem', marginBottom: '0.75rem' }}>
                        <h3
                            style={{
                                color: '#8b9ec7',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                margin: 0,
                            }}
                        >
                            {effectiveView === 'calendar'
                                ? 'Calendarios'
                                : effectiveView === 'thematic'
                                  ? 'Historial Temático'
                                  : effectiveView === 'landing'
                                    ? 'Reportes Disponibles'
                                    : effectiveView === 'video-repurposer'
                                      ? 'Videos Analizados'
                                      : effectiveView === 'image-studio'
                                        ? 'Imágenes Recientes'
                                        : 'Historial de Reportes'}
                        </h3>
                    </div>
                    {(() => {
                        // ─── Video Repurposer sidebar (reads from video store) ───
                        if (effectiveView === 'video-repurposer') {
                            return <VideoSidebarContent />
                        }

                        // Filter history based on current view context
                        const filteredHistory = (() => {
                            // Calendar view: show ALL calendarios (thematic + monitoring)
                            if (effectiveView === 'calendar') {
                                return history
                                    .filter((h) => h.hasCalendar)
                                    .map((h) => ({
                                        ...h,
                                        id: `cal-${h.id}`,
                                        reportType:
                                            h.reportType === 'thematic'
                                                ? ('thematic-calendar' as string)
                                                : ('monitoring-calendar' as string),
                                        summary:
                                            h.reportType === 'thematic'
                                                ? `${h.topicName || 'Tema'}`
                                                : `Monitoreo · ${h.monitorCount} monitor${h.monitorCount !== 1 ? 'es' : ''}`,
                                    }))
                                    .sort(
                                        (a, b) =>
                                            new Date(b.createdAt).getTime() -
                                            new Date(a.createdAt).getTime(),
                                    )
                            }

                            // Thematic view: show thematic reports + virtual calendar entries
                            if (effectiveView === 'thematic') {
                                const thematic = history.filter((h) => h.reportType === 'thematic')
                                const calendarEntries = thematic
                                    .filter((h) => h.hasCalendar)
                                    .map((h) => ({
                                        ...h,
                                        id: `cal-${h.id}`,
                                        reportType: 'thematic-calendar' as string,
                                        summary: `Calendario de ${h.topicName || 'Tema'}`,
                                    }))
                                return [...thematic, ...calendarEntries].sort(
                                    (a, b) =>
                                        new Date(b.createdAt).getTime() -
                                        new Date(a.createdAt).getTime(),
                                )
                            }

                            // Landing view: show reports as landing sources
                            if (effectiveView === 'landing') {
                                return [...history]
                                    .sort(
                                        (a, b) =>
                                            new Date(b.createdAt).getTime() -
                                            new Date(a.createdAt).getTime(),
                                    )
                                    .map((h) => ({
                                        ...h,
                                        reportType:
                                            h.reportType === 'thematic'
                                                ? ('landing-thematic' as string)
                                                : ('landing-monitoring' as string),
                                    }))
                            }

                            // Default: monitoring reports
                            return history.filter((h) => h.reportType !== 'thematic')
                        })()

                        if (filteredHistory.length === 0)
                            return (
                                <p
                                    style={{
                                        color: '#4B5563',
                                        fontSize: '0.75rem',
                                        padding: '0 1rem',
                                    }}
                                >
                                    {effectiveView === 'calendar'
                                        ? 'Sin calendarios aún'
                                        : effectiveView === 'thematic'
                                          ? 'Sin investigaciones temáticas aún'
                                          : 'Sin reportes aún'}
                                </p>
                            )

                        return (
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                            >
                                {filteredHistory.map((item) => {
                                    const isThematic = item.reportType === 'thematic'
                                    const isAnyCalendar =
                                        item.reportType === 'thematic-calendar' ||
                                        item.reportType === 'monitoring-calendar'
                                    const isThematicCalendar =
                                        item.reportType === 'thematic-calendar'
                                    const isLandingSource =
                                        item.reportType === 'landing-thematic' ||
                                        item.reportType === 'landing-monitoring'
                                    const isLandingThematic = item.reportType === 'landing-thematic'
                                    const hoverColor = isLandingSource
                                        ? '#7C3AED'
                                        : isAnyCalendar
                                          ? '#00c8ff'
                                          : isThematic
                                            ? '#10B981'
                                            : '#00c8ff'
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleHistoryClick(item)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.15rem',
                                                padding: '0.6rem 1rem',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                borderLeft: '2px solid transparent',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = `${hoverColor}08`
                                                e.currentTarget.style.borderLeft = `2px solid ${hoverColor}`
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.borderLeft =
                                                    '2px solid transparent'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                }}
                                            >
                                                {isLandingSource ? (
                                                    <Layout size={12} color="#7C3AED" />
                                                ) : isAnyCalendar ? (
                                                    <CalendarDays size={12} color="#00c8ff" />
                                                ) : isThematic ? (
                                                    <BookOpen size={12} color="#10B981" />
                                                ) : (
                                                    <Clock size={12} color="#6B7280" />
                                                )}
                                                <span
                                                    style={{
                                                        color: '#8b9ec7',
                                                        fontSize: '0.72rem',
                                                    }}
                                                >
                                                    {new Date(item.createdAt).toLocaleDateString(
                                                        'es-AR',
                                                    )}
                                                </span>
                                                {isLandingSource ? (
                                                    <span
                                                        style={{
                                                            fontSize: '0.6rem',
                                                            padding: '0 0.25rem',
                                                            borderRadius: '3px',
                                                            background: isLandingThematic
                                                                ? 'rgba(16,185,129,0.15)'
                                                                : 'rgba(0,200,255,0.15)',
                                                            color: isLandingThematic
                                                                ? '#10B981'
                                                                : '#00c8ff',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {isLandingThematic ? 'TEMA' : 'MONITOREO'}
                                                    </span>
                                                ) : isAnyCalendar ? (
                                                    <span
                                                        style={{
                                                            fontSize: '0.6rem',
                                                            padding: '0 0.25rem',
                                                            borderRadius: '3px',
                                                            background: isThematicCalendar
                                                                ? 'rgba(16,185,129,0.15)'
                                                                : 'rgba(0,200,255,0.15)',
                                                            color: isThematicCalendar
                                                                ? '#10B981'
                                                                : '#00c8ff',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {isThematicCalendar ? 'TEMA' : 'MONITOREO'}
                                                    </span>
                                                ) : isThematic ? (
                                                    <span
                                                        style={{
                                                            fontSize: '0.6rem',
                                                            padding: '0 0.25rem',
                                                            borderRadius: '3px',
                                                            background: 'rgba(16,185,129,0.15)',
                                                            color: '#10B981',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        TEMA
                                                    </span>
                                                ) : null}
                                            </div>
                                            {isLandingSource ? (
                                                <span
                                                    style={{
                                                        color: '#A78BFA',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {isLandingThematic
                                                        ? item.topicName || 'Tema'
                                                        : `${item.monitorCount} monitor${item.monitorCount !== 1 ? 'es' : ''}`}
                                                </span>
                                            ) : isAnyCalendar ? (
                                                <span
                                                    style={{
                                                        color: '#00c8ff',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {isThematicCalendar
                                                        ? item.topicName || 'Tema'
                                                        : item.summary || 'Monitoreo'}
                                                </span>
                                            ) : isThematic ? (
                                                <span
                                                    style={{
                                                        color: '#10B981',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {item.topicName || 'Tema'}
                                                </span>
                                            ) : (
                                                <span
                                                    style={{ color: '#6B7280', fontSize: '0.7rem' }}
                                                >
                                                    {item.monitorCount} monitor
                                                    {item.monitorCount !== 1 ? 'es' : ''}
                                                    {item.changesDetected > 0 &&
                                                        ` · ${item.changesDetected} cambio${item.changesDetected !== 1 ? 's' : ''}`}
                                                </span>
                                            )}
                                            {item.summary && !isAnyCalendar && !isLandingSource && (
                                                <span
                                                    style={{
                                                        color: '#4B5563',
                                                        fontSize: '0.68rem',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '100%',
                                                    }}
                                                >
                                                    {item.summary}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )
                    })()}
                    {/* Video calendar indicator in Calendar sidebar */}
                    {effectiveView === 'calendar' && <VideoCalendarSidebarEntry />}
                </div>

                {/* Main content */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {effectiveView === 'command-center' && <CommandCenter />}
                    {effectiveView === 'campaign-profile' && <CampaignProfileForm />}
                    {effectiveView === 'monitors' && <MonitorConfigPanel />}
                    {effectiveView === 'dashboard' &&
                        (report ? (
                            <PoliticalDashboard />
                        ) : (
                            <EmptyState
                                message="Generá un análisis desde la pestaña Monitors para ver el dashboard."
                                phase={phase}
                            />
                        ))}
                    {effectiveView === 'attack-vectors' &&
                        (report ? (
                            <AttackVectorsPanel />
                        ) : (
                            <EmptyState message="Primero generá un análisis de inteligencia." />
                        ))}
                    {effectiveView === 'thematic' && <ThematicIntelPanel />}
                    {effectiveView === 'calendar' && <PoliticalCalendarView />}
                    {effectiveView === 'landing' && <PoliticalLandingPanel />}
                    {effectiveView === 'video-repurposer' && <VideoRepurposerView />}
                    {effectiveView === 'image-studio' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
                            <ImageStudioView />
                        </div>
                    )}
                    {effectiveView === 'timeline' && (
                        <div style={{ padding: '1.5rem 2rem' }}>
                            <p style={{ color: '#8b9ec7' }}>Timeline de cambios</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Sub-components ─────────────────────────────────────

function NavBtn({
    icon: Icon,
    label,
    active,
    onClick,
    color,
    badge,
    disabled,
}: {
    icon: React.ComponentType<{ size?: number; color?: string }>
    label: string
    active: boolean
    onClick: () => void
    color: string
    badge?: string
    disabled?: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: active ? 700 : 500,
                background: active ? `${color}15` : 'transparent',
                border: `1px solid ${active ? `${color}30` : 'transparent'}`,
                color: active ? color : disabled ? '#4B5563' : '#6B7280',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s',
            }}
        >
            <Icon size={14} color={active ? color : disabled ? '#4B5563' : '#6B7280'} />
            {label}
            {badge && (
                <span
                    style={{
                        padding: '0 0.35rem',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        background: `${color}20`,
                        color,
                    }}
                >
                    {badge}
                </span>
            )}
        </button>
    )
}

/** Shows video-generated calendar entries in the Calendar sidebar */
function VideoCalendarSidebarEntry() {
    const sessions = useVideoRepurposerStore((s) => s.sessions)
    const setView = useIntelligenceStore((s) => s.setView)
    const loadSession = useVideoRepurposerStore((s) => s.loadSession)

    const sessionsWithCalendar = sessions.filter((s) => s.hasCalendar)
    if (sessionsWithCalendar.length === 0) return null

    return (
        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #1e2540', paddingTop: '0.5rem' }}>
            <div style={{ padding: '0 1rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#8b9ec7', fontSize: '0.68rem', fontWeight: 600 }}>
                    DESDE VIDEO
                </span>
            </div>
            {sessionsWithCalendar.map((s) => (
                <button
                    key={s.id}
                    onClick={() => {
                        loadSession(s.id)
                        setView('video-repurposer')
                    }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.15rem',
                        padding: '0.6rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderLeft: '2px solid #F472B6',
                        width: '100%',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(244,114,182,0.05)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Video size={12} color="#F472B6" />
                        <span
                            style={{
                                fontSize: '0.6rem',
                                padding: '0 0.25rem',
                                borderRadius: '3px',
                                background: 'rgba(244,114,182,0.15)',
                                color: '#F472B6',
                                fontWeight: 700,
                            }}
                        >
                            VIDEO
                        </span>
                    </div>
                    <span
                        style={{
                            color: '#F472B6',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                        }}
                    >
                        {s.videoTitle}
                    </span>
                    <span style={{ color: '#8b9ec7', fontSize: '0.68rem' }}>{s.speakerName}</span>
                </button>
            ))}
        </div>
    )
}

/** Sidebar content for the video repurposer — reads from DB sessions + current state */
function VideoSidebarContent() {
    const sessions = useVideoRepurposerStore((s) => s.sessions)
    const sessionId = useVideoRepurposerStore((s) => s.sessionId)
    const analysis = useVideoRepurposerStore((s) => s.analysis)
    const phase = useVideoRepurposerStore((s) => s.phase)
    const loadSession = useVideoRepurposerStore((s) => s.loadSession)

    if (sessions.length === 0 && !analysis) {
        return (
            <p style={{ color: '#4B5563', fontSize: '0.75rem', padding: '0 1rem' }}>
                {phase === 'idle'
                    ? 'Pegá una URL de YouTube para comenzar.'
                    : phase === 'error'
                      ? 'Error en el análisis.'
                      : 'Procesando video...'}
            </p>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {sessions.map((s) => {
                const isActive = s.id === sessionId
                return (
                    <button
                        key={s.id}
                        onClick={() => {
                            if (!isActive) loadSession(s.id)
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.15rem',
                            padding: '0.6rem 1rem',
                            background: isActive ? 'rgba(244,114,182,0.08)' : 'transparent',
                            border: 'none',
                            cursor: isActive ? 'default' : 'pointer',
                            textAlign: 'left',
                            borderLeft: isActive ? '2px solid #F472B6' : '2px solid transparent',
                            width: '100%',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive)
                                e.currentTarget.style.background = 'rgba(244,114,182,0.05)'
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'transparent'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Film size={12} color="#F472B6" />
                            <span style={{ color: '#8b9ec7', fontSize: '0.72rem' }}>
                                {new Date(s.createdAt).toLocaleDateString('es-AR')}
                            </span>
                            {s.hasCalendar && (
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        padding: '0 0.25rem',
                                        borderRadius: '3px',
                                        background: 'rgba(0,200,255,0.15)',
                                        color: '#00c8ff',
                                        fontWeight: 700,
                                    }}
                                >
                                    CAL
                                </span>
                            )}
                            {s.clipCount > 0 && (
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        padding: '0 0.25rem',
                                        borderRadius: '3px',
                                        background: 'rgba(52,211,153,0.15)',
                                        color: '#34D399',
                                        fontWeight: 700,
                                    }}
                                >
                                    {s.clipCount} clips
                                </span>
                            )}
                        </div>
                        <span
                            style={{
                                color: '#F472B6',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                display: 'block',
                            }}
                        >
                            {s.videoTitle}
                        </span>
                        <span style={{ color: '#6B7280', fontSize: '0.68rem' }}>
                            {s.speakerName}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

function EmptyState({ message, phase }: { message: string; phase?: string }) {
    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                padding: '2rem',
            }}
        >
            <Radar size={48} color="#1e2540" />
            <p style={{ color: '#6B7280', fontSize: '0.9rem', textAlign: 'center', maxWidth: 400 }}>
                {message}
            </p>
            {phase && phase !== 'idle' && phase !== 'complete' && phase !== 'error' && (
                <p style={{ color: '#00c8ff', fontSize: '0.85rem' }}>Estado: {phase}</p>
            )}
        </div>
    )
}
