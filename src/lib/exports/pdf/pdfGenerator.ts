import PDFDocument from 'pdfkit'
import type { AttackPlan, AttackPlanMeta, SocialMediaCalendar } from '@/features/attack-plan/types'
import type { IntelReport } from '@/features/market-intel/types'
import type { PoliticalIntelligenceReport } from '@/features/political-intel/types'
import type { StrategyData, StrategyMeta } from '@/features/strategy/types'
import type { Lead } from '@/features/leads/types'

// =============================================
// Shared PDF Utilities
// =============================================

const COLORS = {
    primary: '#00C8FF',
    secondary: '#7C3AED',
    accent: '#FF007F',
    dark: '#0A0E1A',
    text: '#1F2937',
    textMuted: '#6B7280',
    white: '#FFFFFF',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
} as const

function createDoc(): typeof PDFDocument.prototype {
    return new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        info: { Producer: 'BrandVortix', Creator: 'BrandVortix Export Suite' },
    })
}

function collectBuffer(doc: typeof PDFDocument.prototype): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        doc.on('data', (c: Buffer) => chunks.push(c))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
    })
}

function header(doc: typeof PDFDocument.prototype, title: string, subtitle?: string) {
    doc.rect(0, 0, doc.page.width, 80).fill(COLORS.dark)
    doc.fontSize(22).fill(COLORS.primary).text('BrandVortix', 50, 20, { continued: false })
    doc.fontSize(10).fill(COLORS.white).text(title, 50, 48)
    if (subtitle) {
        doc.fontSize(8).fill('#9CA3AF').text(subtitle, 50, 62)
    }
    doc.moveDown(3)
    doc.fill(COLORS.text)
}

function sectionTitle(doc: typeof PDFDocument.prototype, text: string) {
    doc.moveDown(0.5)
    doc.fontSize(14).fill(COLORS.secondary).text(text)
    doc.moveDown(0.3)
    doc.moveTo(doc.x, doc.y)
        .lineTo(doc.x + 200, doc.y)
        .lineWidth(1)
        .stroke(COLORS.secondary)
    doc.moveDown(0.5)
    doc.fill(COLORS.text)
}

function bodyText(doc: typeof PDFDocument.prototype, text: string) {
    doc.fontSize(10).fill(COLORS.text).text(text, { lineGap: 3 })
    doc.moveDown(0.3)
}

function bulletList(doc: typeof PDFDocument.prototype, items: string[]) {
    for (const item of items) {
        doc.fontSize(9).fill(COLORS.text).text(`  \u2022  ${item}`, { indent: 10, lineGap: 2 })
    }
    doc.moveDown(0.3)
}

function metaFooter(doc: typeof PDFDocument.prototype, generatedAt: string) {
    const date = new Date(generatedAt).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
    doc.fontSize(7)
        .fill('#9CA3AF')
        .text(`Generado por BrandVortix \u2022 ${date}`, 50, doc.page.height - 40, {
            align: 'center',
            width: doc.page.width - 100,
        })
}

function checkPage(doc: typeof PDFDocument.prototype, minSpace = 100) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - minSpace) {
        doc.addPage()
    }
}

// =============================================
// Attack Plan PDF
// =============================================

export async function generateAttackPlanPDF(
    plan: AttackPlan,
    meta: AttackPlanMeta,
): Promise<Buffer> {
    const doc = createDoc()
    const bufferPromise = collectBuffer(doc)

    header(doc, 'Attack Plan ZMOT', `${meta.vectorsGenerated} vectores \u2022 ${meta.generatedAt}`)

    // Executive Summary
    sectionTitle(doc, 'Resumen Ejecutivo')
    bodyText(doc, plan.executiveSummary)

    // Overall Strategy
    sectionTitle(doc, 'Estrategia General')
    bodyText(doc, plan.overallStrategy)

    // Attack Matrix
    for (let i = 0; i < plan.attackMatrix.length; i++) {
        const v = plan.attackMatrix[i]
        checkPage(doc, 200)
        sectionTitle(doc, `Vector ${i + 1}: ${v.rivalName}`)

        doc.fontSize(9).fill(COLORS.textMuted).text('Debilidad del rival:')
        bodyText(doc, v.rivalWeakness)
        doc.fontSize(9).fill(COLORS.textMuted).text('Fortaleza de marca:')
        bodyText(doc, v.brandStrength)
        doc.fontSize(9).fill(COLORS.textMuted).text('\u00c1ngulo de ataque:')
        bodyText(doc, v.attackAngle)

        // Ad Copy
        checkPage(doc, 120)
        doc.fontSize(10).fill(COLORS.primary).text('Ad Copy')
        doc.fontSize(9).fill(COLORS.text).text(`Headline: ${v.outputs.adCopy.headline}`)
        doc.fontSize(9).text(`Body: ${v.outputs.adCopy.body}`)
        doc.fontSize(9).text(`CTA: ${v.outputs.adCopy.cta}`)
        doc.moveDown(0.5)

        // LinkedIn
        checkPage(doc, 100)
        doc.fontSize(10).fill(COLORS.primary).text('LinkedIn Post')
        doc.fontSize(9).fill(COLORS.text).text(v.outputs.linkedinPost.body)
        doc.moveDown(0.5)

        // TikTok
        checkPage(doc, 100)
        doc.fontSize(10).fill(COLORS.primary).text('TikTok Script')
        doc.fontSize(9).fill(COLORS.text).text(`Hook: ${v.outputs.tiktokScript.hook}`)
        doc.fontSize(9).text(v.outputs.tiktokScript.script)
        doc.moveDown(0.5)
    }

    // Client Tasks
    if (plan.clientTasks?.length) {
        checkPage(doc)
        sectionTitle(doc, 'Tareas Post-Despliegue')
        bulletList(doc, plan.clientTasks)
    }

    metaFooter(doc, meta.generatedAt)
    doc.end()
    return bufferPromise
}

// =============================================
// Intel Report PDF
// =============================================

export async function generateIntelReportPDF(report: IntelReport): Promise<Buffer> {
    const doc = createDoc()
    const bufferPromise = collectBuffer(doc)

    header(doc, 'Market Intelligence Report')

    sectionTitle(doc, 'Resumen Ejecutivo')
    bodyText(doc, report.executiveSummary)

    // Competitors
    for (const comp of report.competitors) {
        checkPage(doc, 180)
        sectionTitle(doc, `Competidor: ${comp.name}`)
        doc.fontSize(9).fill(COLORS.textMuted).text('Posicionamiento:')
        bodyText(doc, comp.positioning)

        doc.fontSize(9).fill(COLORS.success).text('Fortalezas:')
        bulletList(doc, comp.strengths)

        doc.fontSize(9).fill(COLORS.danger).text('Debilidades:')
        bulletList(doc, comp.weaknesses)

        if (comp.vulnerabilities.length) {
            doc.fontSize(9).fill(COLORS.accent).text('Vulnerabilidades:')
            for (const v of comp.vulnerabilities) {
                doc.fontSize(9)
                    .fill(COLORS.text)
                    .text(`  [${v.severity.toUpperCase()}] ${v.weakness} \u2192 ${v.exploitAngle}`)
            }
            doc.moveDown(0.3)
        }
    }

    // Market Context
    checkPage(doc, 150)
    sectionTitle(doc, 'Contexto de Mercado')
    doc.fontSize(9).fill(COLORS.textMuted).text('Tendencias:')
    bulletList(doc, report.marketContext.trends)
    doc.fontSize(9).fill(COLORS.textMuted).text('Pain Points:')
    bulletList(doc, report.marketContext.painPoints)
    doc.fontSize(9).fill(COLORS.textMuted).text('Oportunidades:')
    bulletList(doc, report.marketContext.opportunities)
    bodyText(doc, `Sentimiento: ${report.marketContext.sentiment}`)

    // Attack Vectors
    if (report.recommendedAttackVectors.length) {
        checkPage(doc)
        sectionTitle(doc, 'Vectores de Ataque Recomendados')
        for (const v of report.recommendedAttackVectors) {
            doc.fontSize(9)
                .fill(
                    v.priority === 'high'
                        ? COLORS.danger
                        : v.priority === 'medium'
                          ? COLORS.warning
                          : COLORS.textMuted,
                )
                .text(`[${v.priority.toUpperCase()}] ${v.rivalName}`)
            doc.fontSize(9).fill(COLORS.text).text(`  ${v.weakness} \u2192 ${v.suggestedAngle}`)
            doc.moveDown(0.2)
        }
    }

    metaFooter(doc, new Date().toISOString())
    doc.end()
    return bufferPromise
}

// =============================================
// Political Intelligence PDF
// =============================================

export async function generatePoliticalReportPDF(
    report: PoliticalIntelligenceReport,
): Promise<Buffer> {
    const doc = createDoc()
    const bufferPromise = collectBuffer(doc)

    header(doc, 'Political Intelligence Report', report.generatedAt)

    sectionTitle(doc, 'Resumen Ejecutivo')
    bodyText(doc, report.executiveSummary)

    // Rankings
    checkPage(doc, 150)
    sectionTitle(doc, 'Rankings por Seguidores')
    for (const p of report.profileRankings.byFollowers.slice(0, 10)) {
        doc.fontSize(9)
            .fill(COLORS.text)
            .text(
                `${p.displayName} (@${p.handle}) \u2014 ${p.followers.toLocaleString('es-AR')} seguidores \u2022 ${p.party}`,
            )
    }
    doc.moveDown(0.5)

    // Strategic Insights
    checkPage(doc, 150)
    sectionTitle(doc, 'Insights Estrat\u00e9gicos')
    doc.fontSize(9).fill(COLORS.textMuted).text('Narrativas dominantes:')
    bulletList(doc, report.strategicInsights.dominantNarratives)
    doc.fontSize(9).fill(COLORS.textMuted).text('Tendencias emergentes:')
    bulletList(doc, report.strategicInsights.emergingTrends)

    // Vulnerabilities
    if (report.strategicInsights.vulnerabilities.length) {
        checkPage(doc)
        doc.fontSize(9).fill(COLORS.accent).text('Vulnerabilidades:')
        for (const v of report.strategicInsights.vulnerabilities) {
            doc.fontSize(9)
                .fill(COLORS.text)
                .text(`  ${v.politician}: ${v.weakness} \u2192 ${v.exploitAngle}`)
        }
        doc.moveDown(0.3)
    }

    // Comparative Analysis
    for (const c of report.comparativeAnalysis) {
        checkPage(doc, 180)
        sectionTitle(doc, `${c.politician} (@${c.handle})`)
        bodyText(doc, c.positioningSummary)
        doc.fontSize(9).fill(COLORS.success).text('Fortalezas:')
        bulletList(doc, c.strengths)
        doc.fontSize(9).fill(COLORS.danger).text('Debilidades:')
        bulletList(doc, c.weaknesses)
    }

    // Recommended Actions
    checkPage(doc)
    sectionTitle(doc, 'Acciones Recomendadas')
    for (const a of report.recommendedActions) {
        doc.fontSize(9)
            .fill(
                a.priority === 'high'
                    ? COLORS.danger
                    : a.priority === 'medium'
                      ? COLORS.warning
                      : COLORS.textMuted,
            )
            .text(`[${a.priority.toUpperCase()}] ${a.action}`)
        doc.fontSize(8).fill(COLORS.textMuted).text(`  ${a.rationale}`)
        doc.moveDown(0.2)
    }

    metaFooter(doc, report.generatedAt)
    doc.end()
    return bufferPromise
}

// =============================================
// Strategy PDF
// =============================================

export async function generateStrategyPDF(
    data: StrategyData,
    meta?: StrategyMeta,
): Promise<Buffer> {
    const doc = createDoc()
    const bufferPromise = collectBuffer(doc)

    header(doc, 'Estrategia Competitiva', meta?.generatedAt)

    // Competitors
    for (const comp of data.competitorAnalysis) {
        checkPage(doc, 180)
        sectionTitle(doc, `Competidor: ${comp.name}`)
        if (comp.url) doc.fontSize(8).fill(COLORS.textMuted).text(comp.url)
        bodyText(doc, `Mensaje principal: ${comp.mainMessage}`)
        doc.fontSize(9).fill(COLORS.success).text('Fortalezas:')
        bulletList(doc, comp.strengths)
        doc.fontSize(9).fill(COLORS.danger).text('Debilidades:')
        bulletList(doc, comp.weaknesses)
        if (comp.pricing) bodyText(doc, `Pricing: ${comp.pricing}`)
    }

    // Market Insights
    checkPage(doc, 150)
    sectionTitle(doc, 'Insights de Mercado')
    doc.fontSize(9).fill(COLORS.textMuted).text('Tendencias:')
    bulletList(doc, data.marketInsights.trends)
    doc.fontSize(9).fill(COLORS.textMuted).text('Pain Points:')
    bulletList(doc, data.marketInsights.painPoints)
    doc.fontSize(9).fill(COLORS.textMuted).text('Oportunidades:')
    bulletList(doc, data.marketInsights.opportunities)

    // Sales Angles
    checkPage(doc, 150)
    sectionTitle(doc, '\u00c1ngulos de Venta')
    for (const angle of data.salesAngles) {
        checkPage(doc, 100)
        doc.fontSize(11).fill(COLORS.primary).text(`${angle.name} (${angle.type})`)
        doc.fontSize(10).fill(COLORS.accent).text(`"${angle.hook}"`)
        bodyText(doc, angle.description)
        for (const v of angle.adVariants) {
            doc.fontSize(8).fill(COLORS.textMuted).text(`  Ad: ${v.headline} \u2014 ${v.body}`)
        }
        doc.moveDown(0.3)
    }

    // Landing Blueprint
    checkPage(doc)
    sectionTitle(doc, `Blueprint: ${data.landingBlueprint.recommendedType}`)
    for (const s of data.landingBlueprint.sections) {
        doc.fontSize(9).fill(COLORS.text).text(`${s.name}: ${s.purpose}`)
    }
    doc.moveDown(0.3)

    // Content Pillars
    checkPage(doc)
    sectionTitle(doc, 'Pilares de Contenido')
    for (const p of data.contentPillars) {
        doc.fontSize(10).fill(COLORS.secondary).text(p.pillar)
        doc.fontSize(8).fill(COLORS.textMuted).text(`Tono: ${p.tone}`)
        bulletList(doc, p.topics)
    }

    metaFooter(doc, meta?.generatedAt || new Date().toISOString())
    doc.end()
    return bufferPromise
}

// =============================================
// Leads PDF
// =============================================

export async function generateLeadsPDF(leads: Lead[], projectName: string): Promise<Buffer> {
    const doc = createDoc()
    const bufferPromise = collectBuffer(doc)

    header(doc, `Leads \u2014 ${projectName}`, `${leads.length} leads capturados`)

    // Simple table
    const colWidths = [120, 160, 90, 80, 50]
    const headers = ['Nombre', 'Email', 'Tel\u00e9fono', 'Fuente', 'Fecha']
    const startX = 50

    // Table header
    doc.fontSize(8).fill(COLORS.white)
    let x = startX
    doc.rect(
        startX,
        doc.y,
        colWidths.reduce((a, b) => a + b, 0),
        20,
    ).fill(COLORS.dark)
    const headerY = doc.y + 6
    for (let i = 0; i < headers.length; i++) {
        doc.fill(COLORS.white).text(headers[i], x + 4, headerY, { width: colWidths[i] - 8 })
        x += colWidths[i]
    }
    doc.y = headerY + 14

    // Table rows
    for (const lead of leads) {
        checkPage(doc, 25)
        x = startX
        const rowY = doc.y + 2
        const row = [
            lead.name || '\u2014',
            lead.email,
            lead.phone || '\u2014',
            lead.source || '\u2014',
            new Date(lead.created_at).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
            }),
        ]
        doc.fontSize(7).fill(COLORS.text)
        for (let i = 0; i < row.length; i++) {
            doc.text(row[i], x + 4, rowY, { width: colWidths[i] - 8 })
            x += colWidths[i]
        }
        doc.y = rowY + 12
        doc.moveTo(startX, doc.y)
            .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), doc.y)
            .lineWidth(0.3)
            .stroke(COLORS.border)
    }

    metaFooter(doc, new Date().toISOString())
    doc.end()
    return bufferPromise
}
