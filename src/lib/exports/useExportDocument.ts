'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export type ExportFormat = 'pdf' | 'pptx' | 'docx' | 'xlsx'
export type ExportType =
    | 'attack-plan'
    | 'intel-report'
    | 'political'
    | 'strategy'
    | 'leads'
    | 'social-calendar'
    | 'competitor-matrix'

interface ExportOptions {
    format: ExportFormat
    type: ExportType
    data: unknown
    filename?: string
}

const FORMAT_MIME: Record<ExportFormat, string> = {
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

const FORMAT_EXT: Record<ExportFormat, string> = {
    pdf: '.pdf',
    pptx: '.pptx',
    docx: '.docx',
    xlsx: '.xlsx',
}

const FORMAT_LABEL: Record<ExportFormat, string> = {
    pdf: 'PDF',
    pptx: 'PowerPoint',
    docx: 'Word',
    xlsx: 'Excel',
}

export function useExportDocument() {
    const [exporting, setExporting] = useState<ExportFormat | null>(null)

    async function exportDocument({ format, type, data, filename }: ExportOptions) {
        setExporting(format)
        const toastId = toast.loading(`Generando ${FORMAT_LABEL[format]}...`)

        try {
            const res = await fetch(`/api/exports/${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
                throw new Error(err.error || `Error ${res.status}`)
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download =
                filename || `${type}-${new Date().toISOString().split('T')[0]}${FORMAT_EXT[format]}`
            a.click()
            URL.revokeObjectURL(url)

            toast.success(`${FORMAT_LABEL[format]} descargado`, { id: toastId })
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al exportar'
            toast.error(msg, { id: toastId })
        } finally {
            setExporting(null)
        }
    }

    return { exportDocument, exporting }
}
