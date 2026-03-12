import {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    TableRow,
    TableCell,
    Table,
    WidthType,
    AlignmentType,
    BorderStyle,
    Packer,
} from 'docx'
import type { AttackPlan, AttackPlanMeta } from '@/features/attack-plan/types'
import type { PoliticalIntelReport } from '@/features/political-intel/types'
import type { StrategyData, StrategyMeta } from '@/features/strategy/types'

// =============================================
// Shared DOCX Utilities
// =============================================

const COLORS = {
    primary: '00C8FF',
    secondary: '7C3AED',
    accent: 'FF007F',
    text: '1F2937',
    muted: '6B7280',
    success: '10B981',
    danger: 'EF4444',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function heading(text: string, level: any = HeadingLevel.HEADING_1) {
    return new Paragraph({
        heading: level,
        spacing: { before: 300, after: 120 },
        children: [new TextRun({ text, bold: true, color: COLORS.secondary, font: 'Arial' })],
    })
}

function body(text: string) {
    return new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text, size: 20, color: COLORS.text, font: 'Arial' })],
    })
}

function bullet(text: string) {
    return new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text, size: 20, color: COLORS.text, font: 'Arial' })],
    })
}

function label(text: string, color = COLORS.muted) {
    return new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
            new TextRun({
                text: text.toUpperCase(),
                size: 16,
                bold: true,
                color,
                font: 'Arial',
            }),
        ],
    })
}

function spacer() {
    return new Paragraph({ spacing: { after: 200 }, children: [] })
}

function footer(generatedAt: string) {
    const date = new Date(generatedAt).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
    return new Paragraph({
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: `Generado por BrandVortix \u2022 ${date}`,
                size: 14,
                color: COLORS.muted,
                font: 'Arial',
            }),
        ],
    })
}

// =============================================
// Attack Plan DOCX
// =============================================

export async function generateAttackPlanDOCX(
    plan: AttackPlan,
    meta: AttackPlanMeta,
): Promise<Buffer> {
    const children: (Paragraph | Table)[] = []

    // Title
    children.push(
        new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
                new TextRun({
                    text: 'Attack Plan ZMOT',
                    bold: true,
                    size: 48,
                    color: COLORS.primary,
                    font: 'Arial',
                }),
            ],
        }),
    )
    children.push(
        body(
            `${meta.vectorsGenerated} vectores de ataque \u2022 ${new Date(meta.generatedAt).toLocaleDateString('es-AR')}`,
        ),
    )
    children.push(spacer())

    // Executive Summary
    children.push(heading('Resumen Ejecutivo'))
    children.push(body(plan.executiveSummary))

    // Overall Strategy
    children.push(heading('Estrategia General'))
    children.push(body(plan.overallStrategy))

    // Attack Vectors
    for (let i = 0; i < plan.attackMatrix.length; i++) {
        const v = plan.attackMatrix[i]
        children.push(heading(`Vector ${i + 1}: ${v.rivalName}`))

        children.push(label('Debilidad del rival'))
        children.push(body(v.rivalWeakness))
        children.push(label('Fortaleza de marca'))
        children.push(body(v.brandStrength))
        children.push(label('\u00c1ngulo de ataque'))
        children.push(body(v.attackAngle))

        children.push(label('Ad Copy', COLORS.primary))
        children.push(body(`Headline: ${v.outputs.adCopy.headline}`))
        children.push(body(`Body: ${v.outputs.adCopy.body}`))
        children.push(body(`CTA: ${v.outputs.adCopy.cta}`))

        children.push(label('LinkedIn Post', COLORS.primary))
        children.push(body(`${v.outputs.linkedinPost.hook}\n${v.outputs.linkedinPost.body}`))

        children.push(label('TikTok Script', COLORS.primary))
        children.push(body(`Hook: ${v.outputs.tiktokScript.hook}`))
        children.push(body(v.outputs.tiktokScript.script))

        children.push(spacer())
    }

    // Client Tasks
    if (plan.clientTasks?.length) {
        children.push(heading('Tareas Post-Despliegue'))
        for (const task of plan.clientTasks) {
            children.push(bullet(task))
        }
    }

    children.push(footer(meta.generatedAt))

    const doc = new Document({
        sections: [{ children }],
    })

    return Buffer.from(await Packer.toBuffer(doc))
}

// =============================================
// Political Intelligence DOCX
// =============================================

export async function generatePoliticalReportDOCX(report: PoliticalIntelReport): Promise<Buffer> {
    const children: (Paragraph | Table)[] = []

    children.push(
        new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
                new TextRun({
                    text: 'Reporte de Inteligencia Pol\u00edtica',
                    bold: true,
                    size: 48,
                    color: COLORS.secondary,
                    font: 'Arial',
                }),
            ],
        }),
    )
    children.push(spacer())

    // Executive Summary
    children.push(heading('Resumen Ejecutivo'))
    children.push(body(report.executiveSummary))

    // Rankings table
    children.push(heading('Rankings por Seguidores'))
    const rankRows = report.profileRankings.byFollowers.slice(0, 10).map(
        (p, i) =>
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 500, type: WidthType.DXA },
                        children: [body(`${i + 1}`)],
                    }),
                    new TableCell({
                        width: { size: 3000, type: WidthType.DXA },
                        children: [body(`${p.displayName} (@${p.handle})`)],
                    }),
                    new TableCell({
                        width: { size: 1500, type: WidthType.DXA },
                        children: [body(p.party)],
                    }),
                    new TableCell({
                        width: { size: 2000, type: WidthType.DXA },
                        children: [body(p.followers.toLocaleString('es-AR'))],
                    }),
                    new TableCell({
                        width: { size: 1500, type: WidthType.DXA },
                        children: [body(p.audienceEfficiency)],
                    }),
                ],
            }),
    )
    if (rankRows.length) {
        const headerRow = new TableRow({
            children: ['#', 'Pol\u00edtico', 'Partido', 'Seguidores', 'Eficiencia'].map(
                (h) =>
                    new TableCell({
                        width: { size: 1700, type: WidthType.DXA },
                        shading: { fill: 'F3F4F6' },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: h,
                                        bold: true,
                                        size: 18,
                                        font: 'Arial',
                                    }),
                                ],
                            }),
                        ],
                    }),
            ),
        })
        children.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [headerRow, ...rankRows],
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                    left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                    right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                },
            }),
        )
    }

    // Strategic Insights
    children.push(heading('Insights Estrat\u00e9gicos'))
    children.push(label('Narrativas dominantes'))
    for (const n of report.strategicInsights.dominantNarratives) children.push(bullet(n))
    children.push(label('Tendencias emergentes'))
    for (const t of report.strategicInsights.emergingTrends) children.push(bullet(t))

    // Vulnerabilities
    if (report.strategicInsights.vulnerabilities.length) {
        children.push(label('Vulnerabilidades', COLORS.danger))
        for (const v of report.strategicInsights.vulnerabilities) {
            children.push(body(`${v.politician}: ${v.weakness} \u2192 ${v.exploitAngle}`))
        }
    }

    // Comparative Analysis
    children.push(heading('An\u00e1lisis Comparativo'))
    for (const c of report.comparativeAnalysis) {
        children.push(heading(`${c.politician} (@${c.handle})`, HeadingLevel.HEADING_2))
        children.push(body(c.positioningSummary))
        children.push(label('Fortalezas', COLORS.success))
        for (const s of c.strengths) children.push(bullet(s))
        children.push(label('Debilidades', COLORS.danger))
        for (const w of c.weaknesses) children.push(bullet(w))
    }

    // Recommended Actions
    children.push(heading('Acciones Recomendadas'))
    for (const a of report.recommendedActions) {
        children.push(
            new Paragraph({
                spacing: { after: 60 },
                children: [
                    new TextRun({
                        text: `[${a.priority.toUpperCase()}] `,
                        bold: true,
                        size: 20,
                        color:
                            a.priority === 'high'
                                ? COLORS.danger
                                : a.priority === 'medium'
                                  ? COLORS.accent
                                  : COLORS.muted,
                        font: 'Arial',
                    }),
                    new TextRun({ text: a.action, size: 20, color: COLORS.text, font: 'Arial' }),
                ],
            }),
        )
        children.push(body(`  ${a.rationale}`))
    }

    children.push(footer(report.generatedAt))

    const doc = new Document({ sections: [{ children }] })
    return Buffer.from(await Packer.toBuffer(doc))
}

// =============================================
// Strategy DOCX
// =============================================

export async function generateStrategyDOCX(
    data: StrategyData,
    meta?: StrategyMeta,
): Promise<Buffer> {
    const children: (Paragraph | Table)[] = []

    children.push(
        new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
                new TextRun({
                    text: 'Estrategia Competitiva',
                    bold: true,
                    size: 48,
                    color: COLORS.primary,
                    font: 'Arial',
                }),
            ],
        }),
    )
    children.push(spacer())

    // Competitors
    children.push(heading('An\u00e1lisis de Competidores'))
    for (const comp of data.competitorAnalysis) {
        children.push(heading(comp.name, HeadingLevel.HEADING_2))
        children.push(body(`Mensaje: ${comp.mainMessage}`))
        children.push(label('Fortalezas', COLORS.success))
        for (const s of comp.strengths) children.push(bullet(s))
        children.push(label('Debilidades', COLORS.danger))
        for (const w of comp.weaknesses) children.push(bullet(w))
        if (comp.pricing) children.push(body(`Pricing: ${comp.pricing}`))
    }

    // Market Insights
    children.push(heading('Insights de Mercado'))
    children.push(label('Tendencias'))
    for (const t of data.marketInsights.trends) children.push(bullet(t))
    children.push(label('Pain Points'))
    for (const p of data.marketInsights.painPoints) children.push(bullet(p))
    children.push(label('Oportunidades'))
    for (const o of data.marketInsights.opportunities) children.push(bullet(o))

    // Sales Angles
    children.push(heading('\u00c1ngulos de Venta'))
    for (const angle of data.salesAngles) {
        children.push(heading(`${angle.name} (${angle.type})`, HeadingLevel.HEADING_2))
        children.push(
            new Paragraph({
                spacing: { after: 80 },
                children: [
                    new TextRun({
                        text: `"${angle.hook}"`,
                        italics: true,
                        size: 22,
                        color: COLORS.accent,
                        font: 'Arial',
                    }),
                ],
            }),
        )
        children.push(body(angle.description))
        for (const v of angle.adVariants) {
            children.push(body(`Ad: ${v.headline} \u2014 ${v.body}`))
        }
    }

    // Blueprint
    children.push(heading(`Blueprint: ${data.landingBlueprint.recommendedType}`))
    for (const s of data.landingBlueprint.sections) {
        children.push(bullet(`${s.name}: ${s.purpose}`))
    }

    // Content Pillars
    children.push(heading('Pilares de Contenido'))
    for (const p of data.contentPillars) {
        children.push(heading(`${p.pillar}`, HeadingLevel.HEADING_2))
        children.push(body(`Tono: ${p.tone}`))
        for (const t of p.topics) children.push(bullet(t))
    }

    children.push(footer(meta?.generatedAt || new Date().toISOString()))

    const doc = new Document({ sections: [{ children }] })
    return Buffer.from(await Packer.toBuffer(doc))
}
