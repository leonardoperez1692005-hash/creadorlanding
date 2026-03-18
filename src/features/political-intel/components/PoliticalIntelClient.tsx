'use client'

import { useEffect, useCallback, useState } from 'react'
import {
    Radar,
    Shield,
    Users,
    BarChart3,
    CalendarDays,
    Layout,
    Clock,
    BookOpen,
    Video,
    Film,
    ImagePlus,
    Brain,
    Trash2,
    Thermometer,
    ChevronDown,
    Package,
} from 'lucide-react'
import { useIntelligenceStore, type IntelligenceView } from '../store/intelligenceStore'
import { useVideoRepurposerStore } from '@/features/video-repurposer/store/videoRepurposerStore'

const VALID_VIEWS = new Set<IntelligenceView>([
    'command-center',
    'campaign-profile',
    'monitors',
    'thematic',
    'thermometer',
    'dashboard',
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
// AttackVectorsPanel moved to PoliticalDashboard → Acciones
import { PoliticalCalendarView } from './PoliticalCalendarView'
import { PoliticalLandingPanel } from './PoliticalLandingPanel'
import { ThematicIntelPanel } from './ThematicIntelPanel'
import { VideoRepurposerView } from '@/features/video-repurposer/components/VideoRepurposerView'
import { ImageStudioView } from '@/features/image-studio/components/ImageStudioView'
import { CommandCenter } from './CommandCenter'
import { SentimentPanel } from './SentimentThermometer'

interface PoliticalIntelClientProps {
    initialMonitors?: PoliticalMonitor[]
    initialHistory?: PoliticalReportHistoryItem[]
    initialReport?: {
        report: import('../types').PoliticalIntelReport
        meta: import('../types').PoliticalSnapshotMeta | null
        reportId: string
    } | null
    allowedIntelViews?: string[]
}

export function PoliticalIntelClient({
    initialMonitors,
    initialHistory,
    initialReport,
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
        reportId: activeReportId,
        thematicReportId: activeThematicReportId,
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
        deleteReport,
        // activeTopicId used elsewhere
    } = useIntelligenceStore()

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

        // Hydrate most recent report from server so dashboard is immediately available
        if (initialReport) {
            useIntelligenceStore.setState({
                report: initialReport.report,
                meta: initialReport.meta,
                reportId: initialReport.reportId,
                phase: 'complete',
            })
        }

        // Always load full history from DB, then auto-load latest report if not already loaded
        loadHistory().then(() => {
            const state = useIntelligenceStore.getState()
            // If we still have no active report but history has monitoring reports, auto-load the latest
            if (!state.report && state.history.length > 0) {
                const latestMonitoring = state.history.find((h) => h.reportType === 'report')
                if (latestMonitoring) {
                    loadReport(latestMonitoring.id)
                }
            }
        })

        loadTopics()

        // Load video sessions for sidebar
        useVideoRepurposerStore.getState().loadSessions()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // NOTE: History refresh happens inside generate(), generateThematicReport(), etc.
    // No need to re-fetch on every view change — it caused unnecessary re-renders.

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
                        <p style={{ fontSize: '0.925rem', color: '#8b9ec7', margin: 0 }}>
                            Monitoreo de rivales · Inteligencia Artificial · Multi-país
                        </p>
                    </div>
                </div>

                {/* Nav buttons */}
                <div
                    style={{
                        display: 'flex',
                        gap: '0.35rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <NavBtn
                        icon={Brain}
                        label="CENTRO"
                        active={effectiveView === 'command-center'}
                        onClick={() => setView('command-center')}
                    />
                    {isViewAllowed('campaign-profile') && (
                        <NavBtn
                            icon={Shield}
                            label="CAMPAÑA"
                            active={effectiveView === 'campaign-profile'}
                            onClick={() => setView('campaign-profile')}
                        />
                    )}
                    {isViewAllowed('monitors') && (
                        <NavBtn
                            icon={Users}
                            label="MONITORS"
                            active={effectiveView === 'monitors'}
                            onClick={() => setView('monitors')}
                            badge={monitors.length > 0 ? String(monitors.length) : undefined}
                            disabled={profileRequired}
                        />
                    )}
                    {isViewAllowed('thematic') && (
                        <NavBtn
                            icon={BookOpen}
                            label="TEMAS"
                            active={effectiveView === 'thematic'}
                            onClick={() => setView('thematic')}
                            disabled={profileRequired}
                        />
                    )}
                    <NavBtn
                        icon={Thermometer}
                        label="TERMÓMETRO"
                        active={effectiveView === 'thermometer'}
                        onClick={() => setView('thermometer')}
                        disabled={profileRequired}
                    />
                    {isViewAllowed('dashboard') && (
                        <NavBtn
                            icon={BarChart3}
                            label="DASHBOARD"
                            active={effectiveView === 'dashboard'}
                            onClick={() => setView('dashboard')}
                            disabled={profileRequired}
                        />
                    )}
                    {/* ATAQUES fusionado en DASHBOARD → Acciones */}
                    {isViewAllowed('calendar') && (
                        <NavBtn
                            icon={CalendarDays}
                            label="CALENDARIO"
                            active={effectiveView === 'calendar'}
                            onClick={() => setView('calendar')}
                            disabled={
                                profileRequired ||
                                (attackVectors.length === 0 &&
                                    thematicAngles.length === 0 &&
                                    !history.some((h) => h.hasCalendar))
                            }
                        />
                    )}
                    {/* Dropdown: CONTENIDO (Landing + Video + Imágenes) */}
                    <NavDropdown
                        icon={Package}
                        label="CONTENIDO"
                        active={['landing', 'video-repurposer', 'image-studio'].includes(
                            effectiveView,
                        )}
                        disabled={profileRequired}
                        items={[
                            ...(isViewAllowed('landing')
                                ? [
                                      {
                                          icon: Layout,
                                          label: 'LANDING',
                                          view: 'landing' as IntelligenceView,
                                          active: effectiveView === 'landing',
                                          disabled:
                                              profileRequired ||
                                              (attackVectors.length === 0 &&
                                                  thematicAngles.length === 0 &&
                                                  history.length === 0),
                                      },
                                  ]
                                : []),
                            ...(isViewAllowed('video-repurposer')
                                ? [
                                      {
                                          icon: Video,
                                          label: 'VIDEO',
                                          view: 'video-repurposer' as IntelligenceView,
                                          active: effectiveView === 'video-repurposer',
                                          disabled: profileRequired,
                                      },
                                  ]
                                : []),
                            ...(isViewAllowed('image-studio')
                                ? [
                                      {
                                          icon: ImagePlus,
                                          label: 'IMÁGENES',
                                          view: 'image-studio' as IntelligenceView,
                                          active: effectiveView === 'image-studio',
                                          disabled: profileRequired,
                                      },
                                  ]
                                : []),
                        ]}
                        onSelect={(view) => setView(view)}
                    />
                    {profileRequired && (
                        <span
                            style={{
                                fontSize: '0.875rem',
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
                {/* History Sidebar — hidden on landing view */}
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
                                color: effectiveView === 'landing' ? '#A78BFA' : '#8b9ec7',
                                fontSize: '0.925rem',
                                fontWeight: 600,
                                margin: 0,
                            }}
                        >
                            {effectiveView === 'calendar'
                                ? 'Calendarios'
                                : effectiveView === 'thematic'
                                  ? 'Historial Temático'
                                  : effectiveView === 'thermometer'
                                    ? 'Termómetro'
                                    : effectiveView === 'landing'
                                      ? '🧠 Fuentes de Inteligencia'
                                      : effectiveView === 'video-repurposer'
                                        ? 'Videos Analizados'
                                        : effectiveView === 'image-studio'
                                          ? 'Imágenes Recientes'
                                          : 'Historial de Reportes'}
                        </h3>
                        {effectiveView === 'landing' && (
                            <p
                                style={{
                                    color: '#6B7280',
                                    fontSize: '0.8rem',
                                    margin: '0.3rem 0 0',
                                }}
                            >
                                Seleccioná un informe para cargar sus vectores y ángulos en la
                                landing
                            </p>
                        )}
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

                            // Landing view: show reports as intelligence sources with clear labels
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
                                        summary:
                                            h.reportType === 'thematic'
                                                ? h.topicName || 'Tema'
                                                : `${h.monitorCount} monitor${h.monitorCount !== 1 ? 'es' : ''}`,
                                    }))
                            }

                            // Default: monitoring reports
                            return history.filter((h) => h.reportType !== 'thematic')
                        })()

                        // Landing view: show active report banner at top
                        if (
                            effectiveView === 'landing' &&
                            (activeReportId || activeThematicReportId)
                        ) {
                            const hasMonitoringReport = activeReportId && report
                            const hasThematicReport = activeThematicReportId
                            const activeInHistory = filteredHistory.some(
                                (h) => h.id === activeReportId || h.id === activeThematicReportId,
                            )
                            if (!activeInHistory && (hasMonitoringReport || hasThematicReport)) {
                                return (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        {/* Active report not in history — show pinned banner */}
                                        <div
                                            style={{
                                                margin: '0 0.5rem 0.5rem',
                                                padding: '0.6rem 0.75rem',
                                                borderRadius: '8px',
                                                background: 'rgba(124,58,237,0.1)',
                                                border: '1px solid rgba(124,58,237,0.25)',
                                                borderLeft: '3px solid #A78BFA',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: '#A78BFA',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    marginBottom: '0.2rem',
                                                }}
                                            >
                                                INFORME ACTIVO
                                            </div>
                                            <div style={{ color: '#c4cfe8', fontSize: '0.85rem' }}>
                                                {hasMonitoringReport
                                                    ? `Monitoreo — ${report.comparativeAnalysis?.length ?? 0} rivales analizados`
                                                    : 'Reporte temático'}
                                            </div>
                                            {attackVectors.length > 0 && (
                                                <div
                                                    style={{
                                                        color: '#F87171',
                                                        fontSize: '0.8rem',
                                                        marginTop: '0.15rem',
                                                    }}
                                                >
                                                    {attackVectors.length} vector
                                                    {attackVectors.length > 1 ? 'es' : ''} ZMOT
                                                </div>
                                            )}
                                            {thematicAngles.length > 0 && (
                                                <div
                                                    style={{
                                                        color: '#10B981',
                                                        fontSize: '0.8rem',
                                                        marginTop: '0.15rem',
                                                    }}
                                                >
                                                    {thematicAngles.length} ángulo
                                                    {thematicAngles.length > 1 ? 's' : ''} temático
                                                    {thematicAngles.length > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                        {/* Rest of history */}
                                        {filteredHistory.length > 0 && (
                                            <div
                                                style={{
                                                    padding: '0 0.75rem',
                                                    marginBottom: '0.25rem',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: '#4B5563',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                    }}
                                                >
                                                    Otros informes
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        }

                        if (filteredHistory.length === 0)
                            return (
                                <p
                                    style={{
                                        color: '#4B5563',
                                        fontSize: '0.875rem',
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
                                    // Real ID (strip cal- prefix for virtual calendar entries)
                                    const realId = item.id.startsWith('cal-')
                                        ? item.id.replace('cal-', '')
                                        : item.id
                                    const isConfirming = confirmDeleteId === realId
                                    // Highlight active report in ALL views (not just landing)
                                    const isActiveReport =
                                        realId === activeReportId ||
                                        realId === activeThematicReportId
                                    const activeColor =
                                        isLandingThematic || isThematic || isThematicCalendar
                                            ? '#10B981'
                                            : '#00c8ff'

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'stretch',
                                                borderLeft: isActiveReport
                                                    ? `3px solid ${activeColor}`
                                                    : '2px solid transparent',
                                                background: isActiveReport
                                                    ? `${activeColor}15`
                                                    : undefined,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = `${hoverColor}08`
                                                e.currentTarget.style.borderLeft = `2px solid ${hoverColor}`
                                                const delBtn = e.currentTarget.querySelector(
                                                    '.delete-report-btn',
                                                ) as HTMLElement
                                                if (delBtn) delBtn.style.opacity = '0.7'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.borderLeft =
                                                    '2px solid transparent'
                                                const delBtn = e.currentTarget.querySelector(
                                                    '.delete-report-btn',
                                                ) as HTMLElement
                                                if (delBtn) delBtn.style.opacity = '0'
                                                if (isConfirming) setConfirmDeleteId(null)
                                            }}
                                        >
                                            <button
                                                onClick={() => handleHistoryClick(item)}
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.15rem',
                                                    padding: '0.6rem 0.5rem 0.6rem 1rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
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
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        {new Date(
                                                            item.createdAt,
                                                        ).toLocaleDateString('es-AR')}{' '}
                                                        <span
                                                            style={{
                                                                color: '#4B5563',
                                                                fontSize: '0.8rem',
                                                            }}
                                                        >
                                                            {new Date(
                                                                item.createdAt,
                                                            ).toLocaleTimeString('es-AR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </span>
                                                    {isLandingSource ? (
                                                        <span
                                                            style={{
                                                                fontSize: '0.8rem',
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
                                                            {isLandingThematic
                                                                ? 'TEMA'
                                                                : 'MONITOREO'}
                                                        </span>
                                                    ) : isAnyCalendar ? (
                                                        <span
                                                            style={{
                                                                fontSize: '0.8rem',
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
                                                            {isThematicCalendar
                                                                ? 'TEMA'
                                                                : 'MONITOREO'}
                                                        </span>
                                                    ) : isThematic ? (
                                                        <span
                                                            style={{
                                                                fontSize: '0.8rem',
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
                                                            fontSize: '0.85rem',
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
                                                            fontSize: '0.85rem',
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
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {item.topicName || 'Tema'}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: '#6B7280',
                                                            fontSize: '0.85rem',
                                                        }}
                                                    >
                                                        {item.monitorCount} monitor
                                                        {item.monitorCount !== 1 ? 'es' : ''}
                                                        {item.changesDetected > 0 &&
                                                            ` · ${item.changesDetected} cambio${item.changesDetected !== 1 ? 's' : ''}`}
                                                    </span>
                                                )}
                                                {item.summary &&
                                                    !isAnyCalendar &&
                                                    !isLandingSource && (
                                                        <span
                                                            style={{
                                                                color: '#4B5563',
                                                                fontSize: '0.825rem',
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
                                            {/* Delete button */}
                                            {isConfirming ? (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        gap: '0.15rem',
                                                        paddingRight: '0.5rem',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <button
                                                        onClick={async () => {
                                                            await deleteReport(realId)
                                                            setConfirmDeleteId(null)
                                                        }}
                                                        style={{
                                                            background: '#EF4444',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 700,
                                                            padding: '0.15rem 0.3rem',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Sí
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        style={{
                                                            background: '#374151',
                                                            color: '#9CA3AF',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 700,
                                                            padding: '0.15rem 0.3rem',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="delete-report-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setConfirmDeleteId(realId)
                                                    }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '0.4rem 0.5rem',
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                    aria-label="Eliminar reporte"
                                                    title="Eliminar reporte"
                                                >
                                                    <Trash2 size={14} color="#EF4444" />
                                                </button>
                                            )}
                                        </div>
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
                        (report ? <PoliticalDashboard /> : <DashboardAutoLoader />)}
                    {/* attack-vectors view removed — now inside Dashboard → Acciones */}
                    {effectiveView === 'thematic' && <ThematicIntelPanel />}
                    {effectiveView === 'thermometer' && <SentimentPanel />}
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
    badge,
    disabled,
}: {
    icon: React.ComponentType<{ size?: number; color?: string }>
    label: string
    active: boolean
    onClick: () => void
    badge?: string
    disabled?: boolean
}) {
    const activeColor = '#00c8ff'
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
                fontSize: '0.875rem',
                fontWeight: active ? 700 : 500,
                letterSpacing: '0.03em',
                background: active ? `${activeColor}15` : 'transparent',
                border: `1px solid ${active ? `${activeColor}30` : 'transparent'}`,
                color: active ? activeColor : disabled ? '#4B5563' : '#e2e8f0',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s',
                textTransform: 'uppercase' as const,
            }}
        >
            <Icon size={14} color={active ? activeColor : disabled ? '#4B5563' : '#e2e8f0'} />
            {label}
            {badge && (
                <span
                    style={{
                        padding: '0 0.35rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: `${activeColor}20`,
                        color: activeColor,
                    }}
                >
                    {badge}
                </span>
            )}
        </button>
    )
}

function NavDropdown({
    icon: Icon,
    label,
    active,
    disabled,
    items,
    onSelect,
}: {
    icon: React.ComponentType<{ size?: number; color?: string }>
    label: string
    active: boolean
    disabled?: boolean
    items: Array<{
        icon: React.ComponentType<{ size?: number; color?: string }>
        label: string
        view: IntelligenceView
        active: boolean
        disabled?: boolean
    }>
    onSelect: (view: IntelligenceView) => void
}) {
    const [open, setOpen] = useState(false)
    const activeColor = '#00c8ff'

    // Find label of active sub-item (if any)
    const activeItem = items.find((i) => i.active)
    const displayLabel = activeItem ? activeItem.label : label

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.03em',
                    background: active ? `${activeColor}15` : 'transparent',
                    border: `1px solid ${active ? `${activeColor}30` : 'transparent'}`,
                    color: active ? activeColor : disabled ? '#4B5563' : '#e2e8f0',
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.15s',
                    textTransform: 'uppercase' as const,
                }}
            >
                <Icon size={14} color={active ? activeColor : disabled ? '#4B5563' : '#e2e8f0'} />
                {displayLabel}
                <ChevronDown
                    size={12}
                    color={active ? activeColor : '#e2e8f0'}
                    style={{
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s',
                    }}
                />
            </button>
            {open && (
                <>
                    {/* Click-away overlay */}
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                        onClick={() => setOpen(false)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            right: 0,
                            zIndex: 99,
                            background: '#111827',
                            border: '1px solid #1e2540',
                            borderRadius: '8px',
                            padding: '0.35rem',
                            minWidth: '160px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        }}
                    >
                        {items.map((item) => {
                            const ItemIcon = item.icon
                            return (
                                <button
                                    key={item.view}
                                    onClick={() => {
                                        if (!item.disabled) {
                                            onSelect(item.view)
                                            setOpen(false)
                                        }
                                    }}
                                    disabled={item.disabled}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '5px',
                                        fontSize: '0.875rem',
                                        fontWeight: item.active ? 700 : 500,
                                        background: item.active
                                            ? `${activeColor}15`
                                            : 'transparent',
                                        border: 'none',
                                        color: item.active
                                            ? activeColor
                                            : item.disabled
                                              ? '#4B5563'
                                              : '#e2e8f0',
                                        cursor: item.disabled ? 'default' : 'pointer',
                                        opacity: item.disabled ? 0.5 : 1,
                                        width: '100%',
                                        textAlign: 'left',
                                        textTransform: 'uppercase' as const,
                                        letterSpacing: '0.03em',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!item.active && !item.disabled)
                                            e.currentTarget.style.background = '#1e2540'
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!item.active && !item.disabled)
                                            e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    <ItemIcon
                                        size={14}
                                        color={
                                            item.active
                                                ? activeColor
                                                : item.disabled
                                                  ? '#4B5563'
                                                  : '#e2e8f0'
                                        }
                                    />
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
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
                <span style={{ color: '#8b9ec7', fontSize: '0.825rem', fontWeight: 600 }}>
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
                                fontSize: '0.8rem',
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
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                        }}
                    >
                        {s.videoTitle}
                    </span>
                    <span style={{ color: '#8b9ec7', fontSize: '0.825rem' }}>{s.speakerName}</span>
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
            <p style={{ color: '#4B5563', fontSize: '0.875rem', padding: '0 1rem' }}>
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
                            <span style={{ color: '#8b9ec7', fontSize: '0.875rem' }}>
                                {new Date(s.createdAt).toLocaleDateString('es-AR')}
                            </span>
                            {s.hasCalendar && (
                                <span
                                    style={{
                                        fontSize: '0.8rem',
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
                                        fontSize: '0.8rem',
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
                                fontSize: '0.85rem',
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
                        <span style={{ color: '#6B7280', fontSize: '0.825rem' }}>
                            {s.speakerName}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

/**
 * Auto-loads the latest monitoring report when dashboard has no active report.
 * Shows a loading state while fetching, then either renders the dashboard
 * or shows EmptyState if there's truly no data.
 */
function DashboardAutoLoader() {
    const { history, report, phase, loadReport } = useIntelligenceStore()
    const [attempted, setAttempted] = useState(false)

    useEffect(() => {
        if (report || attempted) return
        const latestMonitoring = history.find((h) => h.reportType === 'report')
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time flag, not cascading
        setAttempted(true)
        if (latestMonitoring) {
            void loadReport(latestMonitoring.id)
        }
    }, [report, history, attempted, loadReport])

    // Report loaded successfully → render dashboard
    if (report) return <PoliticalDashboard />

    // Still loading — only show spinner if we haven't attempted yet
    if (!attempted) {
        return (
            <div
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            border: '3px solid #1e2540',
                            borderTopColor: '#00c8ff',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 1rem',
                        }}
                    />
                    <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                        Cargando último reporte...
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            </div>
        )
    }

    // No reports exist — guide the user
    return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
                <h3
                    style={{
                        color: '#fff',
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        margin: '0 0 0.5rem',
                    }}
                >
                    No hay reportes de inteligencia aún
                </h3>
                <p
                    style={{
                        color: '#8b9ec7',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        margin: '0 0 1.25rem',
                    }}
                >
                    Para ver el dashboard necesitás generar un análisis primero. Andá a{' '}
                    <strong style={{ color: '#00c8ff' }}>Monitors</strong> y hacé click en{' '}
                    <strong style={{ color: '#00c8ff' }}>Analizar</strong> para escanear a tus
                    rivales, o andá a <strong style={{ color: '#10B981' }}>Temas</strong> para
                    investigar un tema social.
                </p>
            </div>
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
            <p style={{ color: '#6B7280', fontSize: '1rem', textAlign: 'center', maxWidth: 400 }}>
                {message}
            </p>
            {phase && phase !== 'idle' && phase !== 'complete' && phase !== 'error' && (
                <p style={{ color: '#00c8ff', fontSize: '0.95rem' }}>Estado: {phase}</p>
            )}
        </div>
    )
}
