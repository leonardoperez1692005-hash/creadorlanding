'use client'

import { useState } from 'react'
import type { AttackVector } from '../types'
import { Megaphone, Video, Linkedin, Layout } from 'lucide-react'

interface Props {
    vector: AttackVector
    index: number
}

type Tab = 'ad' | 'tiktok' | 'linkedin' | 'landing'

const TABS: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: 'ad', label: 'Ad Copy', icon: Megaphone },
    { id: 'tiktok', label: 'TikTok', icon: Video },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { id: 'landing', label: 'Landing', icon: Layout },
]

export function AttackVectorCard({ vector, index }: Props) {
    const [tab, setTab] = useState<Tab>('ad')

    return (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            {/* Header: weakness → strength → angle */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-start gap-3">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-[var(--pink)]/20 text-[var(--pink)] shrink-0">
                        #{index + 1}
                    </span>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm mb-1">
                            <span className="text-red-400 font-medium">{vector.rivalName}</span>
                            <span className="text-[var(--text-muted)]">→</span>
                            <span className="text-[var(--cyan)] font-medium">{vector.attackAngle}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-red-500/5 rounded px-2 py-1.5">
                                <span className="text-[10px] text-red-400 uppercase block">Debilidad Rival</span>
                                <span className="text-xs text-[var(--text-secondary)]">{vector.rivalWeakness}</span>
                            </div>
                            <div className="bg-green-500/5 rounded px-2 py-1.5">
                                <span className="text-[10px] text-green-400 uppercase block">Nuestra Fortaleza</span>
                                <span className="text-xs text-[var(--text-secondary)]">{vector.brandStrength}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-[var(--border)]">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${
                            tab === t.id
                                ? 'text-[var(--cyan)] border-b-2 border-[var(--cyan)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="p-4">
                {tab === 'ad' && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Headline</span>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{vector.outputs.adCopy.headline}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Body</span>
                            <p className="text-sm text-[var(--text-secondary)]">{vector.outputs.adCopy.body}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">CTA</span>
                            <p className="text-sm text-[var(--cyan)] font-medium">{vector.outputs.adCopy.cta}</p>
                        </div>
                    </div>
                )}

                {tab === 'tiktok' && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Hook (3s)</span>
                            <p className="text-sm font-semibold text-[var(--pink)]">{vector.outputs.tiktokScript.hook}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Script (30s)</span>
                            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{vector.outputs.tiktokScript.script}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">CTA</span>
                            <p className="text-sm text-[var(--cyan)] font-medium">{vector.outputs.tiktokScript.cta}</p>
                        </div>
                    </div>
                )}

                {tab === 'linkedin' && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Hook</span>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{vector.outputs.linkedinPost.hook}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Post</span>
                            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{vector.outputs.linkedinPost.body}</p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {vector.outputs.linkedinPost.hashtags.map((h, i) => (
                                <span key={i} className="text-xs text-[var(--purple)] bg-[var(--purple)]/10 px-2 py-0.5 rounded">#{h}</span>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'landing' && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Hero Headline</span>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{vector.outputs.landingSectionCopy.heroHeadline}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Subheadline</span>
                            <p className="text-sm text-[var(--text-secondary)]">{vector.outputs.landingSectionCopy.heroSubheadline}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Beneficio</span>
                            <p className="text-sm text-[var(--cyan)] font-medium">{vector.outputs.landingSectionCopy.benefitTitle}</p>
                            <p className="text-xs text-[var(--text-muted)]">{vector.outputs.landingSectionCopy.benefitDescription}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Urgencia</span>
                            <p className="text-sm text-amber-400">{vector.outputs.landingSectionCopy.urgencyText}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
