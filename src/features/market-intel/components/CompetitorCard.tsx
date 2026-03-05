'use client'

import type { CompetitorAnalysis } from '../types'
import { Shield, AlertTriangle, Target } from 'lucide-react'

interface Props {
    competitor: CompetitorAnalysis
}

export function CompetitorCard({ competitor }: Props) {
    return (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{competitor.name}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{competitor.positioning}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Strengths */}
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-medium text-green-400 uppercase">Fortalezas</span>
                    </div>
                    <ul className="space-y-1">
                        {competitor.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-[var(--text-secondary)]">+ {s}</li>
                        ))}
                    </ul>
                </div>

                {/* Weaknesses */}
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-medium text-red-400 uppercase">Debilidades</span>
                    </div>
                    <ul className="space-y-1">
                        {competitor.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-[var(--text-secondary)]">- {w}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Vulnerabilities */}
            {competitor.vulnerabilities.length > 0 && (
                <div className="border-t border-[var(--border)] pt-3 mt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Target className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium text-amber-400 uppercase">Vulnerabilidades</span>
                    </div>
                    <div className="space-y-2">
                        {competitor.vulnerabilities.map((v, i) => (
                            <div key={i} className="bg-[var(--bg-secondary)] rounded p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        v.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                        v.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-blue-500/20 text-blue-400'
                                    }`}>{v.severity.toUpperCase()}</span>
                                    <span className="text-sm text-[var(--text-primary)]">{v.weakness}</span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Angulo: {v.exploitAngle}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Meta */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-xs text-[var(--text-muted)]">
                    <span className="text-[var(--text-secondary)]">Audiencia:</span> {competitor.audienceProfile}
                </div>
            </div>
        </div>
    )
}
