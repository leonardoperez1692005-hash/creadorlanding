'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { logger } from '@/shared/lib/logger'
import { useWizardStore } from '../store/wizardStore'
import { initializeSections, getStructureType, buildSectionsFromContent } from '../config/constants'
import { fetchProjectAction } from '../actions'
import { getBrandIdentityAction } from '@/features/onboarding/actions'
import { getAttackPlanLandingDataAction } from '@/features/attack-plan/actions'
import type { ProjectStructureType, DesignColors } from '../types'

/**
 * Encapsulates all wizard initialization logic:
 * - Edit mode (load from DB)
 * - Template gallery
 * - Strategy AI content
 * - Attack plan
 * - Brand identity defaults
 *
 * Returns `ready` flag — false while async init is in progress.
 */
export function useWizardInit(projectId?: string) {
    const store = useWizardStore()
    const searchParams = useSearchParams()
    const isEditMode = Boolean(projectId)

    // Track if strategy data was already loaded (survives React 18 Strict Mode double-run)
    const strategyLoadedRef = useRef(false)

    // Prevent flash of type step when initializing from template/strategy/edit/attack
    const needsAsyncInit =
        isEditMode ||
        Boolean(searchParams.get('templateId')) ||
        searchParams.get('fromStrategy') === '1' ||
        Boolean(searchParams.get('fromAttackPlan'))
    const [ready, setReady] = useState(!needsAsyncInit)

    useEffect(() => {
        const isFromStrategy = searchParams.get('fromStrategy') === '1'
        const templateType = searchParams.get('templateType')
        const templateId = searchParams.get('templateId')
        const fromAttackPlan = searchParams.get('fromAttackPlan')

        // ZMOT Attack Plan — load content-driven sections from Supabase
        if (fromAttackPlan && !strategyLoadedRef.current) {
            strategyLoadedRef.current = true
            getAttackPlanLandingDataAction(fromAttackPlan).then((result) => {
                if (result.success && result.data) {
                    const { content, landingSections, projectName } = result.data
                    const sections = buildSectionsFromContent(landingSections, content)
                    store.loadFromStrategy('zmot_attack', sections, projectName)
                }
                setReady(true)
            })
            return
        }

        if (isEditMode && projectId) {
            store.reset(true)
            store.setIsLoading(true)
            store.setProjectId(projectId)
            fetchProjectAction(projectId).then((result) => {
                if (result.success && result.data) {
                    const { name, structureType, visualModel, sections, colors, meta } = result.data
                    store.loadProject({
                        name,
                        structureType,
                        visualModel: visualModel as 'dark' | 'light',
                        sections: sections as Parameters<typeof store.setSections>[0],
                        colors: colors as DesignColors,
                        meta,
                    })
                }
                store.setIsLoading(false)
                setReady(true)
            })
        } else if (templateId && !strategyLoadedRef.current) {
            strategyLoadedRef.current = true
            const freshSections = initializeSections(templateId)

            if (isFromStrategy) {
                const storedContent =
                    typeof window !== 'undefined'
                        ? localStorage.getItem('bv_strategy_content')
                        : null
                if (storedContent) {
                    try {
                        const contentJson = JSON.parse(storedContent)
                        const updatedSections = freshSections.map(
                            (section: {
                                id: string
                                type: string
                                content: Record<string, unknown>
                                isVisible: boolean
                                order: number
                            }) => {
                                const generatedData = contentJson[section.id as string]
                                if (generatedData) return { ...section, content: generatedData }
                                return section
                            },
                        )
                        store.loadFromStrategy(
                            templateId,
                            updatedSections,
                            `Nuevo - ${getStructureType(templateId).label}`,
                        )
                        setTimeout(() => {
                            localStorage.removeItem('bv_strategy_content')
                            localStorage.removeItem('bv_strategy_type')
                        }, 500)
                    } catch (e) {
                        logger.error('wizard', 'Error parsing strategy data for template', e)
                        store.loadFromStrategy(
                            templateId,
                            freshSections,
                            `Nuevo - ${getStructureType(templateId).label}`,
                        )
                    }
                } else {
                    store.loadFromStrategy(
                        templateId,
                        freshSections,
                        `Nuevo - ${getStructureType(templateId).label}`,
                    )
                }
            } else {
                store.loadFromStrategy(
                    templateId,
                    freshSections,
                    `Nuevo - ${getStructureType(templateId).label}`,
                )
            }
            setReady(true)

            // Load brand identity as default colors + typography + geometry
            getBrandIdentityAction().then((res) => {
                if (res.success && res.data) {
                    applyBrandDefaults(res.data, store)
                }
            })
        } else if (templateId && strategyLoadedRef.current) {
            // React 18 Strict Mode re-run: template already loaded, skip
            return
        } else if (isFromStrategy) {
            // Legacy: fromStrategy without templateId
            if (strategyLoadedRef.current) return

            const storedContent =
                typeof window !== 'undefined' ? localStorage.getItem('bv_strategy_content') : null
            const storedType =
                typeof window !== 'undefined' ? localStorage.getItem('bv_strategy_type') : null

            if (storedContent && (templateType || storedType)) {
                try {
                    const contentJson = JSON.parse(storedContent)
                    const type = (templateType || storedType) as ProjectStructureType
                    const freshSections = initializeSections(type)

                    const aiKeys = Object.keys(contentJson)
                    const expectedIds = freshSections.map((s: { id: string }) => s.id)
                    const missing = expectedIds.filter((id: string) => !contentJson[id])
                    if (missing.length > 0) {
                        logger.warn('wizard', 'Secciones no generadas por IA', { missing, aiKeys })
                    }
                    logger.debug('wizard', 'Content recibido', {
                        preview: JSON.stringify(contentJson).substring(0, 500),
                    })

                    const updatedSections = freshSections.map(
                        (section: {
                            id: string
                            type: string
                            content: Record<string, unknown>
                            isVisible: boolean
                            order: number
                        }) => {
                            const generatedData = contentJson[section.id]
                            if (generatedData) return { ...section, content: generatedData }
                            return section
                        },
                    )

                    store.loadFromStrategy(type, updatedSections, `Landing - ${type.toUpperCase()}`)
                    strategyLoadedRef.current = true

                    setTimeout(() => {
                        localStorage.removeItem('bv_strategy_content')
                        localStorage.removeItem('bv_strategy_type')
                    }, 500)
                } catch (e) {
                    logger.error('wizard', 'Error parsing strategy data', e)
                    store.reset(false)
                }
            } else {
                logger.warn('wizard', 'fromStrategy=1 pero no hay datos en localStorage')
                store.reset(false)
            }
            setReady(true)
        } else {
            // Guard: after first save, replaceState updates URL to ?projectId=XXX
            const urlProjectId = searchParams.get('projectId')
            if (urlProjectId && store.projectId === urlProjectId) return

            store.reset(false)
            getBrandIdentityAction().then((res) => {
                if (res.success && res.data) {
                    applyBrandDefaults(res.data, store)
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, searchParams])

    return { ready, isEditMode }
}

/** Extract colors + typography + geometry from brand identity into DesignColors */
function applyBrandDefaults(
    branding: Record<string, unknown>,
    store: { setCustomColors: (c: DesignColors) => void },
) {
    const merged: DesignColors = {}
    if (branding.colors && typeof branding.colors === 'object') {
        Object.assign(merged, branding.colors)
    }
    const typo = branding.typography as { headings?: string; body?: string } | null
    if (typo?.headings) merged.fontHeading = typo.headings
    if (typo?.body) merged.fontBody = typo.body
    const geo = branding.geometry as { radius?: string } | null
    if (geo?.radius) merged.borderRadius = geo.radius as DesignColors['borderRadius']
    store.setCustomColors(merged)
}
