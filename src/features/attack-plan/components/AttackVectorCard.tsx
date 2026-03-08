'use client'

import { useState, memo } from 'react'
import type { AttackVector } from '../types'
import { useAttackPlanStore } from '../store/attackPlanStore'
import { EditableText } from './EditableText'
import { Megaphone, Video, Linkedin, Layout, Copy, Check, Instagram, Twitter } from 'lucide-react'

interface Props {
    vector: AttackVector
    index: number
}

type Tab = 'ad' | 'tiktok' | 'linkedin' | 'instagram' | 'x' | 'landing'

const TABS: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: 'ad', label: 'Anuncio', icon: Megaphone },
    { id: 'tiktok', label: 'TikTok', icon: Video },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'x', label: 'X', icon: Twitter },
    { id: 'landing', label: 'Landing', icon: Layout },
]

function getTabText(tab: Tab, vector: AttackVector): string {
    switch (tab) {
        case 'ad':
            return `${vector.outputs.adCopy.headline}\n\n${vector.outputs.adCopy.body}\n\n${vector.outputs.adCopy.cta}`
        case 'tiktok':
            return `🎬 ${vector.outputs.tiktokScript.hook}\n\n${vector.outputs.tiktokScript.script}\n\n👉 ${vector.outputs.tiktokScript.cta}`
        case 'linkedin':
            return `${vector.outputs.linkedinPost.hook}\n\n${vector.outputs.linkedinPost.body}\n\n${vector.outputs.linkedinPost.hashtags.map((h) => `#${h}`).join(' ')}`
        case 'instagram': {
            const ig = vector.outputs.instagramPost
            if (!ig) return ''
            return `${ig.caption}\n\n📸 ${ig.visualConcept}\n\n${ig.hashtags.map((h) => `#${h}`).join(' ')}`
        }
        case 'x': {
            const xp = vector.outputs.xPost
            if (!xp) return ''
            return `${xp.text}\n\n${xp.hashtags.map((h) => `#${h}`).join(' ')}`
        }
        case 'landing':
            return `${vector.outputs.landingSectionCopy.heroHeadline}\n${vector.outputs.landingSectionCopy.heroSubheadline}\n\n${vector.outputs.landingSectionCopy.benefitTitle}\n${vector.outputs.landingSectionCopy.benefitDescription}\n\n${vector.outputs.landingSectionCopy.urgencyText}`
    }
}

export const AttackVectorCard = memo(function AttackVectorCard({ vector, index }: Props) {
    const [tab, setTab] = useState<Tab>('ad')
    const [copied, setCopied] = useState(false)
    const update = useAttackPlanStore((s) => s.updateVectorField)

    function u(outputKey: string, field: string) {
        return (value: string) => update(index, outputKey, field, value)
    }

    async function copyTab() {
        await navigator.clipboard.writeText(getTabText(tab, vector))
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

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
                            <span className="text-[var(--cyan)] font-medium">
                                {vector.attackAngle}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-red-500/5 rounded px-2 py-1.5">
                                <span className="text-[10px] text-red-400 uppercase block">
                                    Debilidad Rival
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {vector.rivalWeakness}
                                </span>
                            </div>
                            <div className="bg-green-500/5 rounded px-2 py-1.5">
                                <span className="text-[10px] text-green-400 uppercase block">
                                    Nuestra Fortaleza
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {vector.brandStrength}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-[var(--border)] overflow-x-auto">
                {TABS.filter((t) => {
                    // Hide Instagram/X tabs if data doesn't exist (backward compat)
                    if (t.id === 'instagram' && !vector.outputs.instagramPost) return false
                    if (t.id === 'x' && !vector.outputs.xPost) return false
                    return true
                }).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                            tab === t.id
                                ? 'text-[var(--cyan)] border-b-2 border-[var(--cyan)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
                {/* Copy button */}
                <button
                    onClick={copyTab}
                    className="ml-auto flex items-center gap-1 px-3 py-2 text-xs transition-colors"
                    style={{ color: copied ? '#22c55e' : 'var(--text-muted)' }}
                    title="Copiar contenido"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
            </div>

            {/* Tab content */}
            <div className="p-4">
                {tab === 'ad' && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Titular
                            </span>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                <EditableText
                                    value={vector.outputs.adCopy.headline}
                                    onChange={u('adCopy', 'headline')}
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Cuerpo
                            </span>
                            <p className="text-sm text-[var(--text-secondary)]">
                                <EditableText
                                    value={vector.outputs.adCopy.body}
                                    onChange={u('adCopy', 'body')}
                                    multiline
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Llamada a la acción
                            </span>
                            <p className="text-sm text-[var(--cyan)] font-medium">
                                <EditableText
                                    value={vector.outputs.adCopy.cta}
                                    onChange={u('adCopy', 'cta')}
                                />
                            </p>
                        </div>
                    </div>
                )}

                {tab === 'tiktok' && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Gancho (3s)
                            </span>
                            <p className="text-sm font-semibold text-[var(--pink)]">
                                <EditableText
                                    value={vector.outputs.tiktokScript.hook}
                                    onChange={u('tiktokScript', 'hook')}
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Guión (30s)
                            </span>
                            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
                                <EditableText
                                    value={vector.outputs.tiktokScript.script}
                                    onChange={u('tiktokScript', 'script')}
                                    multiline
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Llamada a la acción
                            </span>
                            <p className="text-sm text-[var(--cyan)] font-medium">
                                <EditableText
                                    value={vector.outputs.tiktokScript.cta}
                                    onChange={u('tiktokScript', 'cta')}
                                />
                            </p>
                        </div>
                    </div>
                )}

                {tab === 'linkedin' && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Gancho
                            </span>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                <EditableText
                                    value={vector.outputs.linkedinPost.hook}
                                    onChange={u('linkedinPost', 'hook')}
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Publicación
                            </span>
                            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
                                <EditableText
                                    value={vector.outputs.linkedinPost.body}
                                    onChange={u('linkedinPost', 'body')}
                                    multiline
                                />
                            </p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {vector.outputs.linkedinPost.hashtags.map((h, i) => (
                                <span
                                    key={i}
                                    className="text-xs text-[var(--purple)] bg-[var(--purple)]/10 px-2 py-0.5 rounded"
                                >
                                    #{h}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'instagram' && vector.outputs.instagramPost && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Formato
                            </span>
                            <p className="text-sm text-[#E4405F] font-medium capitalize">
                                {vector.outputs.instagramPost.format}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Concepto Visual
                            </span>
                            <p className="text-sm text-[var(--text-secondary)]">
                                <EditableText
                                    value={vector.outputs.instagramPost.visualConcept}
                                    onChange={u('instagramPost', 'visualConcept')}
                                    multiline
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Caption
                            </span>
                            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
                                <EditableText
                                    value={vector.outputs.instagramPost.caption}
                                    onChange={u('instagramPost', 'caption')}
                                    multiline
                                />
                            </p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {vector.outputs.instagramPost.hashtags.map((h, i) => (
                                <span
                                    key={i}
                                    className="text-xs text-[#E4405F] bg-[#E4405F]/10 px-2 py-0.5 rounded"
                                >
                                    #{h}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'x' && vector.outputs.xPost && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Tweet
                            </span>
                            <p className="text-sm text-[var(--text-secondary)]">
                                <EditableText
                                    value={vector.outputs.xPost.text}
                                    onChange={u('xPost', 'text')}
                                    multiline
                                />
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)]">
                                {vector.outputs.xPost.text.length}/280
                            </span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {vector.outputs.xPost.hashtags.map((h, i) => (
                                <span
                                    key={i}
                                    className="text-xs text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded"
                                >
                                    #{h}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'landing' && (
                    <div className="space-y-2">
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Titular Hero
                            </span>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                                <EditableText
                                    value={vector.outputs.landingSectionCopy.heroHeadline}
                                    onChange={u('landingSectionCopy', 'heroHeadline')}
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Subtítulo
                            </span>
                            <p className="text-sm text-[var(--text-secondary)]">
                                <EditableText
                                    value={vector.outputs.landingSectionCopy.heroSubheadline}
                                    onChange={u('landingSectionCopy', 'heroSubheadline')}
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Beneficio
                            </span>
                            <p className="text-sm text-[var(--cyan)] font-medium">
                                <EditableText
                                    value={vector.outputs.landingSectionCopy.benefitTitle}
                                    onChange={u('landingSectionCopy', 'benefitTitle')}
                                />
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                                <EditableText
                                    value={vector.outputs.landingSectionCopy.benefitDescription}
                                    onChange={u('landingSectionCopy', 'benefitDescription')}
                                    multiline
                                />
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Urgencia
                            </span>
                            <p className="text-sm text-amber-400">
                                <EditableText
                                    value={vector.outputs.landingSectionCopy.urgencyText}
                                    onChange={u('landingSectionCopy', 'urgencyText')}
                                />
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
})
