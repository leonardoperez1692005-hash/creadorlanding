'use server'

import { createClient } from '@/lib/supabase/server'
import { generateAttackPlan } from './generator'
import type { AttackPlan, AttackPlanMeta, BrandProfile } from './types'
import { intelReportSchema } from '@/features/market-intel/schemas'
import { attackPlanSchema } from './schemas'
import { z } from 'zod'

export type AttackActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ================================
// ACTION: GENERATE ATTACK PLAN
// ================================
export async function generateAttackPlanAction(
    intelReportId: string
): Promise<AttackActionResult<{ plan: AttackPlan; meta: AttackPlanMeta; planId: string }>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // Load intel report
        const { data: intelRow, error: intelError } = await supabase
            .from('intel_reports')
            .select('analysis')
            .eq('id', intelReportId)
            .eq('user_id', user.id)
            .single()

        if (intelError || !intelRow) {
            return { success: false, error: 'Reporte de intelligence no encontrado' }
        }

        // Load brand identity
        const { data: brand } = await supabase
            .from('brand_identities')
            .select('brand_name, sector, brand_values, target_audience, business_objective')
            .eq('user_id', user.id)
            .single()

        const brandProfile: BrandProfile = brand ? {
            brandName: brand.brand_name ?? 'Mi Marca',
            sector: brand.sector ?? 'General',
            values: brand.brand_values ?? '',
            targetAudience: brand.target_audience ?? '',
            objective: brand.business_objective ?? 'Ventas',
        } : {
            brandName: 'Mi Marca',
            sector: 'General',
            values: '',
            targetAudience: '',
            objective: 'Ventas',
        }

        // Generate attack plan
        const intelReport = intelReportSchema.parse(intelRow.analysis)
        const plan = await generateAttackPlan(
            intelReport,
            brandProfile
        )

        const meta: AttackPlanMeta = {
            intelReportId,
            brandIdentityUsed: !!brand,
            vectorsGenerated: plan.attackMatrix.length,
            generatedAt: new Date().toISOString(),
        }

        // Save to Supabase
        const { data: row, error: saveError } = await supabase.from('attack_plans').insert({
            user_id: user.id,
            intel_report_id: intelReportId,
            attack_matrix: plan.attackMatrix,
            generated_outputs: {
                landingContent: plan.landingContent,
                recommendedLandingType: plan.recommendedLandingType,
                executiveSummary: plan.executiveSummary,
                overallStrategy: plan.overallStrategy,
            },
        }).select('id').single()

        if (saveError) {
            console.error('[Attack Plan] Save error:', saveError.message)
            return { success: false, error: `Error guardando plan: ${saveError.message}` }
        }

        return { success: true, data: { plan, meta, planId: row.id } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: LOAD ATTACK PLAN
// ================================
export async function loadAttackPlanAction(
    planId: string
): Promise<AttackActionResult<{ plan: AttackPlan; meta: AttackPlanMeta }>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('attack_plans')
            .select('attack_matrix, generated_outputs, intel_report_id, created_at')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

        if (error || !data) return { success: false, error: 'Plan no encontrado' }

        const outputs = (data.generated_outputs ?? {}) as Record<string, unknown>
        const attackMatrix = attackPlanSchema.shape.attackMatrix.parse(data.attack_matrix)
        const plan: AttackPlan = {
            executiveSummary: String(outputs.executiveSummary ?? ''),
            attackMatrix,
            overallStrategy: String(outputs.overallStrategy ?? ''),
            recommendedLandingType: z.enum(['vsl', 'webinar', 'long_letter']).catch('vsl').parse(outputs.recommendedLandingType),
            landingContent: (outputs.landingContent as Record<string, Record<string, unknown>>) ?? {},
        }

        const meta: AttackPlanMeta = {
            intelReportId: data.intel_report_id ?? '',
            brandIdentityUsed: true,
            vectorsGenerated: plan.attackMatrix.length,
            generatedAt: data.created_at,
        }

        return { success: true, data: { plan, meta } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: GET LANDING DATA FOR WIZARD
// ================================
export async function getAttackPlanLandingDataAction(
    planId: string
): Promise<AttackActionResult<{ content: Record<string, Record<string, unknown>>; templateType: string; projectName: string }>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: plan, error } = await supabase
            .from('attack_plans')
            .select('generated_outputs')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

        if (error || !plan) return { success: false, error: 'Plan no encontrado' }

        const outputs = (plan.generated_outputs ?? {}) as Record<string, unknown>

        return {
            success: true,
            data: {
                content: (outputs.landingContent as Record<string, Record<string, unknown>>) ?? {},
                templateType: z.enum(['vsl', 'webinar', 'long_letter']).catch('vsl').parse(outputs.recommendedLandingType),
                projectName: `ZMOT Attack - ${new Date().toLocaleDateString('es-AR')}`,
            },
        }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
