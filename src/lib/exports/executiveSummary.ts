// =============================================
// BrandVortix — Executive Summary Generator
// =============================================
// Generates an email-friendly HTML summary of the
// full pipeline: strategy → attack plan → calendar.

import type { StrategyData } from '@/features/strategy/types'
import type { AttackPlan } from '@/features/attack-plan/types'

interface SummaryInput {
    brandName: string
    strategy?: StrategyData
    attackPlan?: AttackPlan
    generatedAt?: string
}

/**
 * Generate an email-friendly HTML executive summary.
 * Uses inline CSS for maximum email client compatibility.
 */
export function generateExecutiveSummaryHTML(input: SummaryInput): string {
    const { brandName, strategy, attackPlan, generatedAt } = input
    const date = generatedAt
        ? new Date(generatedAt).toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : new Date().toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })

    const sections: string[] = []

    // Header
    sections.push(`
<div style="background:linear-gradient(135deg,#0a0e1a 0%,#1a1f3a 100%);padding:40px 32px;text-align:center;border-radius:12px 12px 0 0">
  <h1 style="color:#00C8FF;font-size:28px;margin:0 0 8px;font-family:system-ui,sans-serif">Resumen Ejecutivo</h1>
  <p style="color:#8b9ec7;font-size:14px;margin:0">${esc(brandName)} · ${esc(date)}</p>
</div>`)

    // Strategy section
    if (strategy) {
        const competitors = strategy.competitorAnalysis?.length ?? 0
        const angles = strategy.salesAngles?.length ?? 0
        const trends = strategy.marketInsights?.trends?.length ?? 0

        sections.push(`
<div style="padding:24px 32px;border-bottom:1px solid #1e2540">
  <h2 style="color:#00C8FF;font-size:18px;margin:0 0 16px;font-family:system-ui,sans-serif">Estrategia Competitiva</h2>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    ${statCard('Competidores analizados', competitors)}
    ${statCard('Ángulos de venta', angles)}
    ${statCard('Tendencias detectadas', trends)}
  </div>
  ${
      strategy.marketInsights?.painPoints?.length
          ? `
  <div style="margin-top:16px">
    <p style="color:#8b9ec7;font-size:13px;margin:0 0 8px;font-weight:600">Puntos de dolor del mercado:</p>
    <ul style="margin:0;padding:0 0 0 20px;color:#CBD5E1;font-size:13px;line-height:1.8">
      ${strategy.marketInsights.painPoints.map((p) => `<li>${esc(p)}</li>`).join('')}
    </ul>
  </div>`
          : ''
  }
</div>`)
    }

    // Attack Plan section
    if (attackPlan) {
        const vectors = attackPlan.attackMatrix?.length ?? 0

        sections.push(`
<div style="padding:24px 32px;border-bottom:1px solid #1e2540">
  <h2 style="color:#FF007F;font-size:18px;margin:0 0 16px;font-family:system-ui,sans-serif">Plan de Ataque ZMOT</h2>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    ${statCard('Vectores de ataque', vectors)}
    ${statCard('Plataformas', '6')}
    ${statCard('Tareas del cliente', attackPlan.clientTasks?.length ?? 0)}
  </div>
  ${
      attackPlan.overallStrategy
          ? `
  <div style="margin-top:16px;padding:16px;background:#111827;border-radius:8px;border-left:3px solid #FF007F">
    <p style="color:#CBD5E1;font-size:13px;margin:0;line-height:1.6">${esc(attackPlan.overallStrategy)}</p>
  </div>`
          : ''
  }
</div>`)

        // Top vectors
        if (attackPlan.attackMatrix?.length) {
            const top3 = attackPlan.attackMatrix.slice(0, 3)
            sections.push(`
<div style="padding:24px 32px;border-bottom:1px solid #1e2540">
  <h3 style="color:#7C3AED;font-size:15px;margin:0 0 12px;font-family:system-ui,sans-serif">Top Vectores de Ataque</h3>
  ${top3
      .map(
          (v) => `
  <div style="margin-bottom:12px;padding:12px 16px;background:#0f1425;border-radius:8px">
    <p style="color:#F59E0B;font-size:13px;font-weight:700;margin:0 0 4px">${esc(v.rivalName)}</p>
    <p style="color:#94A3B8;font-size:12px;margin:0">${esc(v.attackAngle)}</p>
  </div>`,
      )
      .join('')}
</div>`)
        }
    }

    // Footer
    sections.push(`
<div style="padding:24px 32px;text-align:center;background:#0a0e1a;border-radius:0 0 12px 12px">
  <p style="color:#5d7099;font-size:11px;margin:0">Generado por BrandVortix · Automation Systems</p>
</div>`)

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Resumen Ejecutivo - ${esc(brandName)}</title></head>
<body style="margin:0;padding:20px;background:#050810;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:640px;margin:0 auto;background:#0c1024;border-radius:12px;border:1px solid #1e2540;overflow:hidden">
${sections.join('\n')}
</div>
</body>
</html>`
}

function esc(text: string | number): string {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function statCard(label: string, value: string | number): string {
    return `<div style="flex:1;min-width:120px;padding:12px 16px;background:#111827;border-radius:8px;text-align:center">
      <div style="color:#00C8FF;font-size:24px;font-weight:800;margin:0 0 4px">${value}</div>
      <div style="color:#8b9ec7;font-size:11px;text-transform:uppercase;letter-spacing:1px">${esc(label)}</div>
    </div>`
}
