'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, FileText, Presentation, FileSpreadsheet, Loader2 } from 'lucide-react'
import type { ExportFormat, ExportType } from '@/lib/exports/useExportDocument'
import { useExportDocument } from '@/lib/exports/useExportDocument'

interface ExportOption {
    format: ExportFormat
    label: string
    icon: React.ElementType
}

const ALL_OPTIONS: ExportOption[] = [
    { format: 'pdf', label: 'PDF', icon: FileText },
    { format: 'pptx', label: 'PowerPoint', icon: Presentation },
    { format: 'docx', label: 'Word', icon: FileText },
    { format: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
]

interface ExportMenuProps {
    type: ExportType
    data: unknown
    formats?: ExportFormat[]
    filename?: string
    label?: string
}

export function ExportMenu({
    type,
    data,
    formats = ['pdf'],
    filename,
    label = 'Exportar',
}: ExportMenuProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const { exportDocument, exporting } = useExportDocument()

    const options = ALL_OPTIONS.filter((o) => formats.includes(o.format))

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    // Single format — render as direct button
    if (options.length === 1) {
        const opt = options[0]
        const Icon = opt.icon
        return (
            <button
                onClick={() => exportDocument({ format: opt.format, type, data, filename })}
                disabled={!!exporting}
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition hover:bg-white/5 disabled:opacity-50"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
                {exporting === opt.format ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Icon className="w-3.5 h-3.5" />
                )}
                {opt.label}
            </button>
        )
    }

    // Multiple formats — dropdown
    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                disabled={!!exporting}
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition hover:bg-white/5 disabled:opacity-50"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
                {exporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Download className="w-3.5 h-3.5" />
                )}
                {label}
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-1 rounded-xl py-1 z-50 min-w-[160px] shadow-2xl"
                    style={{
                        background: 'var(--bg-card, #0f1425)',
                        border: '1px solid var(--border, #1e2847)',
                    }}
                >
                    {options.map((opt) => {
                        const Icon = opt.icon
                        return (
                            <button
                                key={opt.format}
                                onClick={() => {
                                    setOpen(false)
                                    exportDocument({ format: opt.format, type, data, filename })
                                }}
                                disabled={!!exporting}
                                className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-3 transition hover:bg-white/5 disabled:opacity-50"
                                style={{ color: 'var(--text-secondary, #e2e8f0)' }}
                            >
                                {exporting === opt.format ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Icon className="w-3.5 h-3.5 opacity-60" />
                                )}
                                {opt.label}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
