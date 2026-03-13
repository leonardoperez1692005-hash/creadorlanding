import PptxGenJS from 'pptxgenjs'
import type { AttackPlan, AttackPlanMeta, SocialMediaCalendar } from '@/features/attack-plan/types'
import type { StrategyData, StrategyMeta } from '@/features/strategy/types'

// =============================================
// Shared PPTX Utilities
// =============================================

const BRAND = {
    dark: '0A0E1A',
    primary: '00C8FF',
    secondary: '7C3AED',
    accent: 'FF007F',
    white: 'FFFFFF',
    textMuted: '9CA3AF',
    success: '10B981',
    danger: 'EF4444',
    warning: 'F59E0B',
} as const

function createPptx(title: string): PptxGenJS {
    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_16x9'
    pptx.title = title
    pptx.author = 'BrandVortix'
    pptx.company = 'BrandVortix'
    return pptx
}

function titleSlide(pptx: PptxGenJS, title: string, subtitle: string) {
    const slide = pptx.addSlide()
    slide.background = { color: BRAND.dark }
    slide.addText('BrandVortix', {
        x: 0.5,
        y: 0.3,
        w: 3,
        h: 0.4,
        fontSize: 14,
        color: BRAND.primary,
        bold: true,
    })
    slide.addText(title, {
        x: 0.5,
        y: 2.0,
        w: 9,
        h: 1.5,
        fontSize: 36,
        color: BRAND.white,
        bold: true,
    })
    slide.addText(subtitle, {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 0.6,
        fontSize: 14,
        color: BRAND.textMuted,
    })
    slide.addShape(pptx.ShapeType.rect, {
        x: 0.5,
        y: 3.3,
        w: 2,
        h: 0.04,
        fill: { color: BRAND.primary },
    })
}

function sectionSlide(pptx: PptxGenJS, title: string) {
    const slide = pptx.addSlide()
    slide.background = { color: BRAND.dark }
    slide.addText(title, {
        x: 0.5,
        y: 2.2,
        w: 9,
        h: 1,
        fontSize: 28,
        color: BRAND.white,
        bold: true,
    })
    slide.addShape(pptx.ShapeType.rect, {
        x: 0.5,
        y: 3.2,
        w: 1.5,
        h: 0.04,
        fill: { color: BRAND.accent },
    })
}

function contentSlide(
    pptx: PptxGenJS,
    title: string,
    bullets: string[],
    opts?: { color?: string },
) {
    const slide = pptx.addSlide()
    slide.background = { color: BRAND.dark }
    slide.addText(title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 20,
        color: opts?.color || BRAND.primary,
        bold: true,
    })
    slide.addShape(pptx.ShapeType.rect, {
        x: 0.5,
        y: 0.85,
        w: 9,
        h: 0.02,
        fill: { color: '1E2847' },
    })

    const textRows = bullets.map((b) => ({
        text: b,
        options: {
            fontSize: 12,
            color: BRAND.white,
            bullet: { code: '2022' },
            breakType: 'none' as const,
            paraSpaceAfter: 8,
        },
    }))

    slide.addText(textRows, {
        x: 0.5,
        y: 1.1,
        w: 9,
        h: 4,
        valign: 'top',
    })
    return slide
}

function footerText(slide: PptxGenJS.Slide) {
    slide.addText('BrandVortix', {
        x: 0.5,
        y: 5.1,
        w: 3,
        h: 0.3,
        fontSize: 7,
        color: BRAND.textMuted,
    })
}

// =============================================
// Attack Plan PPTX
// =============================================

/** Genera un PPTX del plan de ataque ZMOT con slides por vector, contenido social y calendario. */
export async function generateAttackPlanPPTX(
    plan: AttackPlan,
    meta: AttackPlanMeta,
    calendar?: SocialMediaCalendar,
): Promise<Buffer> {
    const pptx = createPptx('Attack Plan ZMOT')

    // 1. Title
    titleSlide(
        pptx,
        'Attack Plan ZMOT',
        `${meta.vectorsGenerated} vectores de ataque \u2022 ${new Date(meta.generatedAt).toLocaleDateString('es-AR')}`,
    )

    // 2. Executive Summary
    contentSlide(pptx, 'Resumen Ejecutivo', [plan.executiveSummary])

    // 3. Overall Strategy
    contentSlide(pptx, 'Estrategia General', [plan.overallStrategy])

    // 4-N. Attack Vectors
    for (let i = 0; i < plan.attackMatrix.length; i++) {
        const v = plan.attackMatrix[i]
        sectionSlide(pptx, `Vector ${i + 1}: ${v.rivalName}`)

        // Vector details
        contentSlide(pptx, v.rivalName, [
            `Debilidad: ${v.rivalWeakness}`,
            `Fortaleza de marca: ${v.brandStrength}`,
            `\u00c1ngulo de ataque: ${v.attackAngle}`,
            `Ad: ${v.outputs.adCopy.headline}`,
            `CTA: ${v.outputs.adCopy.cta}`,
        ])

        // Social content
        const socialBullets = [
            `LinkedIn: ${v.outputs.linkedinPost.hook}`,
            `TikTok: ${v.outputs.tiktokScript.hook}`,
        ]
        if (v.outputs.instagramPost) {
            socialBullets.push(
                `Instagram (${v.outputs.instagramPost.format}): ${v.outputs.instagramPost.caption.slice(0, 100)}...`,
            )
        }
        if (v.outputs.xPost) {
            socialBullets.push(`X: ${v.outputs.xPost.text.slice(0, 100)}...`)
        }
        contentSlide(pptx, `${v.rivalName} \u2014 Contenido Social`, socialBullets)
    }

    // Calendar
    if (calendar) {
        sectionSlide(pptx, 'Calendario Social 7 D\u00edas')
        for (const day of calendar.days) {
            const bullets = day.posts.map(
                (p) =>
                    `[${p.bestTime}] ${p.platform.toUpperCase()} \u2014 ${p.topic} (${p.contentType})`,
            )
            contentSlide(pptx, `${day.dayName} (D\u00eda ${day.day})`, bullets)
        }
    }

    // Client Tasks
    if (plan.clientTasks?.length) {
        contentSlide(pptx, 'Tareas Post-Despliegue', plan.clientTasks, { color: BRAND.warning })
    }

    const data = await pptx.write({ outputType: 'nodebuffer' })
    return Buffer.from(data as ArrayBuffer)
}

// =============================================
// Strategy PPTX
// =============================================

/** Genera un PPTX de estrategia competitiva con slides de competidores, insights y ángulos de venta. */
export async function generateStrategyPPTX(
    data: StrategyData,
    meta?: StrategyMeta,
): Promise<Buffer> {
    const pptx = createPptx('Estrategia Competitiva')

    const dateStr = meta?.generatedAt
        ? new Date(meta.generatedAt).toLocaleDateString('es-AR')
        : new Date().toLocaleDateString('es-AR')

    // 1. Title
    titleSlide(pptx, 'Estrategia Competitiva', dateStr)

    // 2. Competitors
    sectionSlide(pptx, 'An\u00e1lisis de Competidores')
    for (const comp of data.competitorAnalysis) {
        contentSlide(pptx, comp.name, [
            `Mensaje: ${comp.mainMessage}`,
            ...comp.strengths.map((s) => `\u2705 ${s}`),
            ...comp.weaknesses.map((w) => `\u274c ${w}`),
            ...(comp.pricing ? [`Pricing: ${comp.pricing}`] : []),
        ])
    }

    // 3. Market Insights
    contentSlide(pptx, 'Tendencias de Mercado', data.marketInsights.trends)
    contentSlide(pptx, 'Pain Points del Mercado', data.marketInsights.painPoints, {
        color: BRAND.danger,
    })
    contentSlide(pptx, 'Oportunidades', data.marketInsights.opportunities, {
        color: BRAND.success,
    })

    // 4. Sales Angles
    sectionSlide(pptx, '\u00c1ngulos de Venta')
    for (const angle of data.salesAngles) {
        contentSlide(pptx, `${angle.name} (${angle.type})`, [
            `Hook: "${angle.hook}"`,
            angle.description,
            ...angle.adVariants.map((v) => `Ad: ${v.headline} \u2014 ${v.body}`),
        ])
    }

    // 5. Landing Blueprint
    contentSlide(
        pptx,
        `Blueprint: ${data.landingBlueprint.recommendedType}`,
        data.landingBlueprint.sections.map((s) => `${s.name}: ${s.purpose}`),
    )

    // 6. Content Pillars
    sectionSlide(pptx, 'Pilares de Contenido')
    for (const p of data.contentPillars) {
        contentSlide(pptx, `${p.pillar} (${p.tone})`, p.topics)
    }

    const output = await pptx.write({ outputType: 'nodebuffer' })
    return Buffer.from(output as ArrayBuffer)
}
