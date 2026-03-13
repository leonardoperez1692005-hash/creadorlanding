import ExcelJS from 'exceljs'
import type { SocialMediaCalendar } from '@/features/attack-plan/types'
import type { CompetitorAnalysis } from '@/features/market-intel/types'
import type { Lead } from '@/features/leads/types'

// =============================================
// Shared XLSX Utilities
// =============================================

const COLORS = {
    primary: '00C8FF',
    headerBg: '0A0E1A',
    headerText: 'FFFFFF',
    accent: 'FF007F',
    success: '10B981',
    danger: 'EF4444',
    warning: 'F59E0B',
    border: 'E5E7EB',
}

function styleHeader(ws: ExcelJS.Worksheet) {
    const headerRow = ws.getRow(1)
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: `FF${COLORS.headerBg}` },
        }
        cell.font = { bold: true, color: { argb: `FF${COLORS.headerText}` }, size: 10 }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
            bottom: { style: 'thin', color: { argb: `FF${COLORS.primary}` } },
        }
    })
    headerRow.height = 28
}

function autoWidth(ws: ExcelJS.Worksheet) {
    ws.columns.forEach((col) => {
        let maxLen = 10
        col.eachCell?.({ includeEmpty: false }, (cell) => {
            const len = String(cell.value ?? '').length
            if (len > maxLen) maxLen = len
        })
        col.width = Math.min(maxLen + 4, 50)
    })
}

// =============================================
// Leads XLSX
// =============================================

/** Genera un XLSX con todos los leads de un proyecto (hoja de datos + hoja resumen). */
export async function generateLeadsXLSX(leads: Lead[], projectName: string): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'BrandVortix'
    wb.created = new Date()

    // Sheet 1: Leads
    const ws = wb.addWorksheet('Leads')
    ws.columns = [
        { header: 'Nombre', key: 'name' },
        { header: 'Email', key: 'email' },
        { header: 'Tel\u00e9fono', key: 'phone' },
        { header: 'Fuente', key: 'source' },
        { header: 'Mensaje', key: 'message' },
        { header: 'Fecha', key: 'date' },
    ]

    for (const lead of leads) {
        ws.addRow({
            name: lead.name || '\u2014',
            email: lead.email,
            phone: lead.phone || '\u2014',
            source: lead.source || '\u2014',
            message: lead.message || '',
            date: new Date(lead.created_at).toLocaleDateString('es-AR'),
        })
    }

    styleHeader(ws)
    autoWidth(ws)

    // Sheet 2: Resumen
    const summary = wb.addWorksheet('Resumen')
    summary.columns = [
        { header: 'M\u00e9trica', key: 'metric' },
        { header: 'Valor', key: 'value' },
    ]
    const sources = leads.reduce<Record<string, number>>((acc, l) => {
        const src = l.source || 'directo'
        acc[src] = (acc[src] ?? 0) + 1
        return acc
    }, {})
    const topSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0]

    summary.addRow({ metric: 'Proyecto', value: projectName })
    summary.addRow({ metric: 'Total leads', value: leads.length })
    summary.addRow({
        metric: 'Top fuente',
        value: topSource ? `${topSource[0]} (${topSource[1]})` : '\u2014',
    })
    summary.addRow({
        metric: '\u00daltimo lead',
        value: leads[0] ? new Date(leads[0].created_at).toLocaleDateString('es-AR') : '\u2014',
    })

    styleHeader(summary)
    autoWidth(summary)

    const buffer = await wb.xlsx.writeBuffer()
    return Buffer.from(buffer)
}

// =============================================
// Social Calendar XLSX
// =============================================

/** Genera un XLSX del calendario social semanal con colores por plataforma y hoja de tips. */
export async function generateSocialCalendarXLSX(calendar: SocialMediaCalendar): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'BrandVortix'

    const ws = wb.addWorksheet('Calendario Social')
    ws.columns = [
        { header: 'D\u00eda', key: 'day' },
        { header: 'Hora', key: 'time' },
        { header: 'Plataforma', key: 'platform' },
        { header: 'Formato', key: 'format' },
        { header: 'Tema', key: 'topic' },
        { header: 'Contenido', key: 'content' },
        { header: 'Hashtags', key: 'hashtags' },
    ]

    for (const day of calendar.days) {
        for (const post of day.posts) {
            ws.addRow({
                day: day.dayName,
                time: post.bestTime,
                platform: post.platform.toUpperCase(),
                format: post.contentType,
                topic: post.topic,
                content: post.content.text.slice(0, 200),
                hashtags: post.content.hashtags.join(', '),
            })
        }
    }

    styleHeader(ws)
    autoWidth(ws)

    // Platform colors
    ws.eachRow({ includeEmpty: false }, (row, num) => {
        if (num === 1) return
        const platform = String(row.getCell('platform').value)
        const colorMap: Record<string, string> = {
            LINKEDIN: '0A66C2',
            TIKTOK: '000000',
            INSTAGRAM: 'E1306C',
            X: '1DA1F2',
        }
        const color = colorMap[platform]
        if (color) {
            row.getCell('platform').font = { color: { argb: `FF${color}` }, bold: true, size: 10 }
        }
    })

    // Tips sheet
    const tips = wb.addWorksheet('Tips')
    tips.columns = [{ header: 'Tips Estrat\u00e9gicos', key: 'tip' }]
    for (const tip of calendar.tips) {
        tips.addRow({ tip })
    }
    styleHeader(tips)
    autoWidth(tips)

    const buffer = await wb.xlsx.writeBuffer()
    return Buffer.from(buffer)
}

// =============================================
// Competitor Matrix XLSX
// =============================================

/** Genera un XLSX con la matriz de competidores (posicionamiento, fortalezas, debilidades) y vulnerabilidades. */
export async function generateCompetitorMatrixXLSX(
    competitors: CompetitorAnalysis[],
): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'BrandVortix'

    const ws = wb.addWorksheet('Competidores')
    ws.columns = [
        { header: 'Competidor', key: 'name' },
        { header: 'Posicionamiento', key: 'positioning' },
        { header: 'Fortalezas', key: 'strengths' },
        { header: 'Debilidades', key: 'weaknesses' },
        { header: 'Estilo Comunicaci\u00f3n', key: 'style' },
        { header: 'Audiencia', key: 'audience' },
    ]

    for (const comp of competitors) {
        ws.addRow({
            name: comp.name,
            positioning: comp.positioning,
            strengths: comp.strengths.join('; '),
            weaknesses: comp.weaknesses.join('; '),
            style: comp.communicationStyle,
            audience: comp.audienceProfile,
        })
    }

    styleHeader(ws)
    autoWidth(ws)

    // Vulnerabilities sheet
    const vulnWs = wb.addWorksheet('Vulnerabilidades')
    vulnWs.columns = [
        { header: 'Competidor', key: 'name' },
        { header: 'Debilidad', key: 'weakness' },
        { header: '\u00c1ngulo de Explotaci\u00f3n', key: 'angle' },
        { header: 'Severidad', key: 'severity' },
    ]

    for (const comp of competitors) {
        for (const v of comp.vulnerabilities) {
            const row = vulnWs.addRow({
                name: comp.name,
                weakness: v.weakness,
                angle: v.exploitAngle,
                severity: v.severity.toUpperCase(),
            })
            const severityCell = row.getCell('severity')
            const colorMap: Record<string, string> = {
                CRITICAL: COLORS.danger,
                HIGH: COLORS.warning,
                MEDIUM: COLORS.primary,
            }
            severityCell.font = {
                bold: true,
                color: { argb: `FF${colorMap[String(severityCell.value)] || COLORS.primary}` },
                size: 10,
            }
        }
    }

    styleHeader(vulnWs)
    autoWidth(vulnWs)

    const buffer = await wb.xlsx.writeBuffer()
    return Buffer.from(buffer)
}
