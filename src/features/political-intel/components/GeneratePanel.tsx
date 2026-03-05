'use client'

import { Radar, Play, Loader2 } from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import { POLITICIANS, BD_COST_PER_REQUEST, SERP_QUERIES } from '../config'

export function GeneratePanel() {
    const { isGenerating, currentPhase, phaseMessage, error, generate } = useIntelligenceStore()

    const totalRequests = POLITICIANS.length + SERP_QUERIES.length
    const estimatedCost = (totalRequests * BD_COST_PER_REQUEST).toFixed(3)

    const phases = [
        { key: 'scraping', label: 'Scraping perfiles X/Twitter' },
        { key: 'researching', label: 'Investigando contexto SERP' },
        { key: 'analyzing', label: 'Analizando con Gemini IA' },
        { key: 'complete', label: 'Completado' },
    ]

    const currentIdx = phases.findIndex(p => p.key === currentPhase)

    return (
        <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '2rem', padding: '2rem',
        }}>
            {/* Icon */}
            <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: 'rgba(0,200,255,0.08)', border: '2px solid rgba(0,200,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Radar size={40} color="#00c8ff" />
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', maxWidth: 550 }}>
                <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                    Intelligence Engine
                </h2>
                <p style={{ color: '#8b9ec7', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Scrapea perfiles politicos de X/Twitter, investiga contexto con SERP
                    y genera un reporte estrategico con inteligencia artificial.
                </p>
            </div>

            {/* Targets list */}
            <div style={{
                padding: '1rem 1.5rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2540',
                maxWidth: 500, width: '100%',
            }}>
                <p style={{ color: '#A78BFA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Targets configurados ({POLITICIANS.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {POLITICIANS.map(p => (
                        <span key={p.handle} style={{
                            padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                            background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.15)',
                            color: '#00c8ff',
                        }}>
                            @{p.handle}
                        </span>
                    ))}
                </div>
                <p style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: '0.6rem' }}>
                    Costo estimado: ~${estimatedCost} USD ({totalRequests} requests Bright Data + 1 Gemini)
                </p>
            </div>

            {/* Progress */}
            {isGenerating && (
                <div style={{
                    maxWidth: 500, width: '100%', padding: '1rem 1.5rem', borderRadius: '10px',
                    background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.15)',
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <Loader2 size={16} color="#00c8ff" style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ color: '#00c8ff', fontSize: '0.85rem', fontWeight: 600 }}>
                            {phaseMessage || 'Procesando...'}
                        </span>
                    </div>
                    {/* Phase steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {phases.map((phase, i) => {
                            const isActive = phase.key === currentPhase
                            const isDone = i < currentIdx
                            return (
                                <div key={phase.key} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '0.8rem',
                                    color: isDone ? '#34D399' : isActive ? '#00c8ff' : '#6B7280',
                                }}>
                                    <span>{isDone ? '✓' : isActive ? '→' : '○'}</span>
                                    <span>{phase.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <p style={{
                    color: '#F87171', fontSize: '0.85rem', maxWidth: 500, textAlign: 'center',
                    padding: '0.75rem', borderRadius: '8px',
                    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                }}>
                    {error}
                </p>
            )}

            {/* Generate button */}
            <button
                onClick={generate}
                disabled={isGenerating}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 2rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
                    background: isGenerating ? 'rgba(0,200,255,0.1)' : 'linear-gradient(135deg, #00c8ff, #7C3AED)',
                    border: 'none', color: '#fff',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    opacity: isGenerating ? 0.6 : 1,
                    transition: 'all 0.2s',
                }}
            >
                {isGenerating
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generando...</>
                    : <><Play size={18} /> Generar Analisis</>
                }
            </button>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
