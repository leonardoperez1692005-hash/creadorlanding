'use client'

import { useEffect } from 'react'
import { Radar, RefreshCw, ExternalLink } from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import type { PoliticalIntelligenceReport, PoliticalSnapshot } from '../types'
import { GeneratePanel } from './GeneratePanel'
import { IntelligenceDashboard } from './IntelligenceDashboard'

interface IntelligenceClientProps {
    initialReport?: PoliticalIntelligenceReport | null
    initialSnapshot?: PoliticalSnapshot | null
}

export function IntelligenceClient({ initialReport, initialSnapshot }: IntelligenceClientProps) {
    const { report, snapshot, currentPhase, clear, setData } = useIntelligenceStore()

    // Load initial data from server if available
    useEffect(() => {
        if (initialReport && initialSnapshot && !report) {
            setData(initialReport, initialSnapshot)
        }
    }, [initialReport, initialSnapshot, report, setData])

    const hasReport = !!report && !!snapshot

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #1e2540',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Radar size={24} color="#00c8ff" />
                    <div>
                        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                            Political Intelligence
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#8b9ec7', margin: 0 }}>
                            Monitoreo de perfiles politicos en X/Twitter via Bright Data + Gemini
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {hasReport && (
                        <>
                            <button
                                onClick={clear}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 1rem', borderRadius: '8px',
                                    background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)',
                                    color: '#00c8ff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                }}
                            >
                                <RefreshCw size={16} /> Nuevo Analisis
                            </button>
                            <a
                                href="/api/intelligence/dashboard"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 1rem', borderRadius: '8px',
                                    background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
                                    color: '#A78BFA', fontSize: '0.85rem', fontWeight: 600,
                                    textDecoration: 'none',
                                }}
                            >
                                <ExternalLink size={16} /> HTML Export
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {hasReport ? (
                <IntelligenceDashboard report={report} snapshot={snapshot} />
            ) : (
                <GeneratePanel />
            )}
        </div>
    )
}
