'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { getUserPermissions, canAccessModule } from '@/lib/permissions'
import { generateAttackPlan, generateSocialCalendar } from './generator'
import type { AttackPlan, AttackPlanMeta, BrandProfile, SocialMediaCalendar } from './types'
import { intelReportSchema } from '@/features/market-intel/schemas'
import { attackPlanSchema, socialMediaCalendarSchema } from './schemas'
// z not used directly — schemas imported from ./schemas

export type AttackActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ================================
// HELPERS (DRY)
// ================================

const BRAND_SELECT =
    'brand_name, sector, brand_values, target_audience, business_objective, differentiators, services, faqs, testimonials, stats, candidate_name, party, ideology_spectrum, core_positions, red_lines, communication_style, country' as const

const DEFAULT_BRAND: BrandProfile = {
    brandName: 'Mi Marca',
    sector: 'General',
    values: '',
    targetAudience: '',
    objective: 'Ventas',
    differentiators: '',
    services: [],
    faqs: [],
    testimonials: [],
    stats: [],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBrandProfile(row: Record<string, any> | null): BrandProfile {
    if (!row) return { ...DEFAULT_BRAND }
    return {
        brandName: row.brand_name ?? 'Mi Marca',
        sector: row.sector ?? 'General',
        values: row.brand_values ?? '',
        targetAudience: row.target_audience ?? '',
        objective: row.business_objective ?? 'Ventas',
        differentiators: row.differentiators ?? '',
        services: (row.services as BrandProfile['services']) ?? [],
        faqs: (row.faqs as BrandProfile['faqs']) ?? [],
        testimonials: (row.testimonials as BrandProfile['testimonials']) ?? [],
        stats: (row.stats as BrandProfile['stats']) ?? [],
        // Political identity (unified brain)
        candidateName: row.candidate_name ?? undefined,
        party: row.party ?? undefined,
        ideologySpectrum: row.ideology_spectrum ?? undefined,
        corePositions: (row.core_positions as BrandProfile['corePositions']) ?? undefined,
        redLines: (row.red_lines as BrandProfile['redLines']) ?? undefined,
        communicationStyle: row.communication_style ?? undefined,
        country: row.country ?? undefined,
    }
}

function reconstructPlan(attackMatrix: unknown, outputs: Record<string, unknown>): AttackPlan {
    return {
        executiveSummary: String(outputs.executiveSummary ?? ''),
        attackMatrix: attackPlanSchema.shape.attackMatrix.parse(attackMatrix),
        overallStrategy: String(outputs.overallStrategy ?? ''),
        landingSections: Array.isArray(outputs.landingSections)
            ? (outputs.landingSections as string[])
            : ['hero', 'benefits', 'lead_capture'],
        landingContent: (outputs.landingContent as Record<string, Record<string, unknown>>) ?? {},
        clientTasks: Array.isArray(outputs.clientTasks) ? (outputs.clientTasks as string[]) : [],
    }
}

/** Genera un plan de ataque ZMOT a partir de un reporte de inteligencia y la identidad de marca. */
export async function generateAttackPlanAction(
    intelReportId: string,
): Promise<AttackActionResult<{ plan: AttackPlan; meta: AttackPlanMeta; planId: string }>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

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
            .select(BRAND_SELECT)
            .eq('user_id', user.id)
            .single()

        if (!brand?.brand_name) {
            return {
                success: false,
                error: 'Completá tu configuración de marca en Onboarding antes de generar un plan de ataque',
            }
        }

        const brandProfile = buildBrandProfile(brand)

        // Generate attack plan
        const intelReport = intelReportSchema.parse(intelRow.analysis)
        const plan = await generateAttackPlan(intelReport, brandProfile)

        const meta: AttackPlanMeta = {
            intelReportId,
            brandIdentityUsed: !!brand,
            vectorsGenerated: plan.attackMatrix.length,
            generatedAt: new Date().toISOString(),
        }

        // Save to Supabase
        const { data: row, error: saveError } = await supabase
            .from('attack_plans')
            .insert({
                user_id: user.id,
                intel_report_id: intelReportId,
                attack_matrix: plan.attackMatrix,
                generated_outputs: {
                    landingContent: plan.landingContent,
                    landingSections: plan.landingSections,
                    executiveSummary: plan.executiveSummary,
                    overallStrategy: plan.overallStrategy,
                    clientTasks: plan.clientTasks,
                },
            })
            .select('id')
            .single()

        if (saveError) {
            logger.error('attack-plan', 'Save error', saveError)
            return { success: false, error: `Error guardando plan: ${saveError.message}` }
        }

        return { success: true, data: { plan, meta, planId: row.id } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

/** Carga un plan de ataque existente por ID desde la base de datos. */
export async function loadAttackPlanAction(
    planId: string,
): Promise<AttackActionResult<{ plan: AttackPlan; meta: AttackPlanMeta }>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('attack_plans')
            .select('attack_matrix, generated_outputs, intel_report_id, created_at')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

        if (error || !data) return { success: false, error: 'Plan no encontrado' }

        const outputs = (data.generated_outputs ?? {}) as Record<string, unknown>
        const plan = reconstructPlan(data.attack_matrix, outputs)

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

/** Lista el historial de planes de ataque del usuario (últimos 10). */
export async function listAttackPlansAction(): Promise<
    AttackActionResult<
        Array<{ id: string; vectorCount: number; createdAt: string; summary: string }>
    >
> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('attack_plans')
            .select('id, attack_matrix, generated_outputs, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) return { success: false, error: error.message }

        const items = (data ?? []).map((row) => {
            const matrix = (row.attack_matrix ?? []) as unknown[]
            const outputs = (row.generated_outputs ?? {}) as Record<string, unknown>
            return {
                id: row.id,
                vectorCount: matrix.length,
                createdAt: row.created_at,
                summary: String(outputs.executiveSummary ?? '').slice(0, 120),
            }
        })

        return { success: true, data: items }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

/** Genera un calendario de redes sociales basado en un plan de ataque. */
export async function generateSocialCalendarAction(
    planId: string,
): Promise<AttackActionResult<{ calendar: SocialMediaCalendar }>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        // Load attack plan
        const { data: planRow, error: planError } = await supabase
            .from('attack_plans')
            .select('attack_matrix, generated_outputs')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

        if (planError || !planRow) return { success: false, error: 'Plan no encontrado' }

        const outputs = (planRow.generated_outputs ?? {}) as Record<string, unknown>
        const plan = reconstructPlan(planRow.attack_matrix, outputs)

        // Load brand profile
        const { data: brand } = await supabase
            .from('brand_identities')
            .select(BRAND_SELECT)
            .eq('user_id', user.id)
            .single()

        const brandProfile = buildBrandProfile(brand)

        // Generate calendar
        const calendar = await generateSocialCalendar(plan, brandProfile)

        // Save alongside the plan
        const updatedOutputs = { ...outputs, socialMediaCalendar: calendar }
        const { error: updateError } = await supabase
            .from('attack_plans')
            .update({ generated_outputs: updatedOutputs })
            .eq('id', planId)
            .eq('user_id', user.id)

        if (updateError) {
            logger.error('attack-plan', 'Social Calendar save error', updateError)
            return { success: false, error: `Error guardando calendario: ${updateError.message}` }
        }

        return { success: true, data: { calendar } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

/** Carga el calendario social guardado en un plan de ataque. */
export async function loadSocialCalendarAction(
    planId: string,
): Promise<AttackActionResult<{ calendar: SocialMediaCalendar | null }>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('attack_plans')
            .select('generated_outputs')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

        if (error || !data) return { success: false, error: 'Plan no encontrado' }

        const outputs = (data.generated_outputs ?? {}) as Record<string, unknown>
        const raw = outputs.socialMediaCalendar
        if (!raw) return { success: true, data: { calendar: null } }

        const calendar = socialMediaCalendarSchema.parse(raw)
        return { success: true, data: { calendar } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

/** Guarda un plan de ataque editado manualmente, preservando el calendario existente. */
export async function saveAttackPlanAction(
    planId: string,
    plan: AttackPlan,
): Promise<AttackActionResult> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        // Load current outputs to preserve calendar and other data
        const { data: current } = await supabase
            .from('attack_plans')
            .select('generated_outputs')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

        const existingOutputs = (current?.generated_outputs ?? {}) as Record<string, unknown>

        const { error } = await supabase
            .from('attack_plans')
            .update({
                attack_matrix: plan.attackMatrix,
                generated_outputs: {
                    ...existingOutputs,
                    landingContent: plan.landingContent,
                    landingSections: plan.landingSections,
                    executiveSummary: plan.executiveSummary,
                    overallStrategy: plan.overallStrategy,
                    clientTasks: plan.clientTasks,
                },
            })
            .eq('id', planId)
            .eq('user_id', user.id)

        if (error) return { success: false, error: error.message }
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: GET LANDING DATA FOR WIZARD
// ================================

/**
 * Enriches the generic landingContent with per-vector ZMOT copy from attackMatrix.
 * Each vector has specific heroHeadline, heroSubheadline, benefitTitle, benefitDescription, urgencyText
 * that are more targeted than the aggregated landingContent.
 */
function enrichLandingContent(
    landingContent: Record<string, Record<string, unknown>>,
    attackMatrix: Array<{
        outputs: {
            landingSectionCopy: {
                heroHeadline: string
                heroSubheadline: string
                benefitTitle: string
                benefitDescription: string
                urgencyText: string
            }
        }
    }>,
): Record<string, Record<string, unknown>> {
    if (!attackMatrix?.length) return landingContent

    const enriched = { ...landingContent }

    // Hero: use first vector's ZMOT-specific headline (most impactful, primary angle)
    const primaryVector = attackMatrix[0]
    enriched.hero = {
        ...(enriched.hero ?? {}),
        headline: primaryVector.outputs.landingSectionCopy.heroHeadline,
        subheadline: primaryVector.outputs.landingSectionCopy.heroSubheadline,
    }

    // Benefits: one per vector — each exploits a different rival weakness
    const zmotBenefits = attackMatrix.map((v) => ({
        title: v.outputs.landingSectionCopy.benefitTitle,
        description: v.outputs.landingSectionCopy.benefitDescription,
    }))
    enriched.benefits = {
        ...(enriched.benefits ?? {}),
        items: zmotBenefits,
    }

    // Urgency: combine all vectors' urgency texts
    const urgencyTexts = attackMatrix.map((v) => v.outputs.landingSectionCopy.urgencyText)
    enriched.urgency = {
        ...(enriched.urgency ?? {}),
        text: urgencyTexts[0], // primary urgency
        items: urgencyTexts, // all urgency angles available
    }

    return enriched
}

/**
 * Merges real Brand Identity data into landing content.
 * Brand data takes priority over AI-generated content for sections the client
 * actually filled in (services, faqs, testimonials, stats, team).
 */
function mergeBrandData(
    content: Record<string, Record<string, unknown>>,
    brand: {
        services?: Array<{ title: string; description: string }>
        faqs?: Array<{ question: string; answer: string }>
        testimonials?: Array<{ text: string; author: string }>
        stats?: Array<{ value: string; label: string }>
        team_members?: Array<{ name: string; role: string }>
        differentiators?: string
    },
): Record<string, Record<string, unknown>> {
    const merged = { ...content }

    // Services: if client has real services, use them as base
    if (brand.services && brand.services.length > 0) {
        merged.services = {
            ...(merged.services ?? {}),
            items: brand.services,
        }
    }

    // FAQ: merge client FAQs with AI-generated ones (client first, AI fills gaps)
    if (brand.faqs && brand.faqs.length > 0) {
        const existingItems = (merged.faq?.items ?? []) as Array<{
            question: string
            answer: string
        }>
        // Client FAQs first, then AI-generated ones that don't duplicate
        const clientQuestions = new Set(brand.faqs.map((f) => f.question.toLowerCase()))
        const uniqueAiItems = existingItems.filter(
            (item) => !clientQuestions.has((item.question || '').toLowerCase()),
        )
        merged.faq = {
            ...(merged.faq ?? {}),
            items: [...brand.faqs, ...uniqueAiItems],
        }
    }

    // Testimonials: if client has real testimonials, replace generated ones
    if (brand.testimonials && brand.testimonials.length > 0) {
        merged.testimonials = {
            ...(merged.testimonials ?? {}),
            items: brand.testimonials,
        }
    }

    // Stats: if client has real stats, replace generated ones
    if (brand.stats && brand.stats.length > 0) {
        merged.stats = {
            ...(merged.stats ?? {}),
            items: brand.stats,
        }
    }

    // Team: if client has team members, use them
    if (brand.team_members && brand.team_members.length > 0) {
        merged.team = {
            ...(merged.team ?? {}),
            items: brand.team_members,
        }
    }

    // About: if client has differentiators, enrich the about section
    if (brand.differentiators) {
        merged.about = {
            ...(merged.about ?? {}),
            text: brand.differentiators,
        }
    }

    return merged
}

/** Obtiene contenido enriquecido para el wizard de landing desde un plan de ataque (ZMOT + Brand Identity). */
export async function getAttackPlanLandingDataAction(planId: string): Promise<
    AttackActionResult<{
        content: Record<string, Record<string, unknown>>
        landingSections: string[]
        projectName: string
    }>
> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        // Load attack plan + brand identity in parallel
        const [planResult, brandResult] = await Promise.all([
            supabase
                .from('attack_plans')
                .select('generated_outputs, attack_matrix')
                .eq('id', planId)
                .eq('user_id', user.id)
                .single(),
            supabase
                .from('brand_identities')
                .select(
                    'services, faqs, testimonials, stats, team_members, differentiators, brand_name',
                )
                .eq('user_id', user.id)
                .single(),
        ])

        if (planResult.error || !planResult.data)
            return { success: false, error: 'Plan no encontrado' }

        const outputs = (planResult.data.generated_outputs ?? {}) as Record<string, unknown>
        const baseLandingContent =
            (outputs.landingContent as Record<string, Record<string, unknown>>) ?? {}

        // Enrich with per-vector ZMOT copy from attack_matrix
        const attackMatrix = (planResult.data.attack_matrix ?? []) as Array<{
            outputs: {
                landingSectionCopy: {
                    heroHeadline: string
                    heroSubheadline: string
                    benefitTitle: string
                    benefitDescription: string
                    urgencyText: string
                }
            }
        }>
        let enrichedContent = enrichLandingContent(baseLandingContent, attackMatrix)

        // Merge real brand identity data (takes priority over AI-generated)
        if (brandResult.data) {
            enrichedContent = mergeBrandData(enrichedContent, {
                services:
                    (brandResult.data.services as Array<{ title: string; description: string }>) ??
                    [],
                faqs: (brandResult.data.faqs as Array<{ question: string; answer: string }>) ?? [],
                testimonials:
                    (brandResult.data.testimonials as Array<{ text: string; author: string }>) ??
                    [],
                stats: (brandResult.data.stats as Array<{ value: string; label: string }>) ?? [],
                team_members:
                    (brandResult.data.team_members as Array<{ name: string; role: string }>) ?? [],
                differentiators: (brandResult.data.differentiators as string) ?? '',
            })
        }

        // Use AI-composed sections, or fallback for old plans
        const landingSections = Array.isArray(outputs.landingSections)
            ? (outputs.landingSections as string[])
            : [
                  'hero',
                  'benefits',
                  'about',
                  'stats',
                  'testimonials',
                  'urgency',
                  'offer',
                  'faq',
                  'lead_capture',
              ]

        const brandName = brandResult.data?.brand_name ?? ''

        return {
            success: true,
            data: {
                content: enrichedContent,
                landingSections,
                projectName: brandName
                    ? `ZMOT - ${brandName}`
                    : `ZMOT Attack - ${new Date().toLocaleDateString('es-AR')}`,
            },
        }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
