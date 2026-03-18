'use client'

import { useState } from 'react'
import type { ProfileMetrics } from '../types'

interface RankingTableProps {
    metrics: ProfileMetrics[]
}

type SortKey =
    | 'followers'
    | 'following'
    | 'followerToFollowingRatio'
    | 'tweetsPerDay'
    | 'audienceEfficiency'

const efficiencyColors: Record<string, string> = {
    high: '#34D399',
    medium: '#FBBF24',
    low: '#F87171',
}

const efficiencyOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
    return String(n)
}

export function RankingTable({ metrics }: RankingTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('followers')
    const [sortAsc, setSortAsc] = useState(false)

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortAsc(!sortAsc)
        } else {
            setSortKey(key)
            setSortAsc(false)
        }
    }

    const sorted = [...metrics].sort((a, b) => {
        let va: number, vb: number
        if (sortKey === 'audienceEfficiency') {
            va = efficiencyOrder[a.audienceEfficiency] ?? 0
            vb = efficiencyOrder[b.audienceEfficiency] ?? 0
        } else {
            va = a[sortKey]
            vb = b[sortKey]
        }
        return sortAsc ? va - vb : vb - va
    })

    const columns: { key: SortKey; label: string }[] = [
        { key: 'followers', label: 'Seguidores' },
        { key: 'following', label: 'Siguiendo' },
        { key: 'followerToFollowingRatio', label: 'Ratio' },
        { key: 'tweetsPerDay', label: 'Tw/dia' },
        { key: 'audienceEfficiency', label: 'Eficiencia' },
    ]

    const headerStyle = (key: SortKey): React.CSSProperties => ({
        padding: '0.6rem 0.75rem',
        textAlign: 'right' as const,
        fontSize: '0.875rem',
        color: sortKey === key ? '#00c8ff' : '#6B7280',
        cursor: 'pointer',
        fontWeight: sortKey === key ? 700 : 500,
        whiteSpace: 'nowrap' as const,
        userSelect: 'none' as const,
        borderBottom: '1px solid #1e2540',
    })

    const cellStyle: React.CSSProperties = {
        padding: '0.6rem 0.75rem',
        textAlign: 'right',
        fontSize: '0.925rem',
        color: '#8b9ec7',
        borderBottom: '1px solid rgba(30,37,64,0.5)',
    }

    return (
        <div
            style={{
                background: '#0A0E1A',
                border: '1px solid #1e2540',
                borderRadius: '12px',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '1rem 1.25rem 0.5rem',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderBottom: '1px solid #1e2540',
                }}
            >
                Ranking Comparativo
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        minWidth: 600,
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{
                                    padding: '0.6rem 0.75rem',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    color: '#6B7280',
                                    borderBottom: '1px solid #1e2540',
                                    width: 40,
                                }}
                            >
                                #
                            </th>
                            <th
                                style={{
                                    padding: '0.6rem 0.75rem',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    color: '#6B7280',
                                    borderBottom: '1px solid #1e2540',
                                }}
                            >
                                Politico
                            </th>
                            <th
                                style={{
                                    padding: '0.6rem 0.75rem',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    color: '#6B7280',
                                    borderBottom: '1px solid #1e2540',
                                }}
                            >
                                Partido
                            </th>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={headerStyle(col.key)}
                                    onClick={() => handleSort(col.key)}
                                >
                                    {col.label} {sortKey === col.key ? (sortAsc ? '↑' : '↓') : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((m, i) => (
                            <tr
                                key={m.handle}
                                style={{
                                    background:
                                        i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                }}
                            >
                                <td style={{ ...cellStyle, textAlign: 'left', color: '#6B7280' }}>
                                    {i + 1}
                                </td>
                                <td
                                    style={{
                                        ...cellStyle,
                                        textAlign: 'left',
                                        color: '#fff',
                                        fontWeight: 600,
                                    }}
                                >
                                    {m.displayName}
                                    <span
                                        style={{
                                            color: '#00c8ff',
                                            fontSize: '0.85rem',
                                            marginLeft: '0.4rem',
                                        }}
                                    >
                                        {m.handle}
                                    </span>
                                </td>
                                <td style={{ ...cellStyle, textAlign: 'left' }}>{m.party}</td>
                                <td style={cellStyle}>{fmt(m.followers)}</td>
                                <td style={cellStyle}>{fmt(m.following)}</td>
                                <td style={cellStyle}>{m.followerToFollowingRatio}</td>
                                <td style={cellStyle}>{m.tweetsPerDay}</td>
                                <td
                                    style={{
                                        ...cellStyle,
                                        color: efficiencyColors[m.audienceEfficiency],
                                        fontWeight: 700,
                                    }}
                                >
                                    {m.audienceEfficiency}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
