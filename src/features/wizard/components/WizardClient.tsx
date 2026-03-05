'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Save, Check, Palette, Monitor, Loader2, Smartphone, ExternalLink, Copy } from 'lucide-react'
import { useWizardStore } from '../store/wizardStore'
import { initializeSections, getStructureType } from '../config/constants'
import { StepType } from './StepType'
import { StepContent } from './StepContent'
import { WizardProgressBar } from './WizardProgressBar'
import { PersonalizationSidebar } from './PersonalizationSidebar'
import { IframePreview } from './IframePreview'
import {
    fetchProjectAction,
    saveProjectAction,
    publishProjectAction,
} from '../actions'
import { getBrandIdentityAction } from '@/features/onboarding/actions'
import { getAttackPlanLandingDataAction } from '@/features/attack-plan/actions'
import type { ProjectStructureType, DesignColors } from '../types'

interface WizardClientProps {
    projectId?: string
}

export function WizardClient({ projectId }: WizardClientProps) {
    const router = useRouter()
    const store = useWizardStore()

    const isEditMode = Boolean(projectId)
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
    const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
    const [savedFeedback, setSavedFeedback] = useState(false)

    const searchParams = useSearchParams()

    // Track if strategy data was already loaded (survives React 18 Strict Mode double-run)
    const strategyLoadedRef = useRef(false)

    // Prevent flash of type step when initializing from template/strategy/edit/attack
    const needsAsyncInit = isEditMode || Boolean(searchParams.get('templateId')) || searchParams.get('fromStrategy') === '1' || Boolean(searchParams.get('fromAttackPlan'))
    const [ready, setReady] = useState(!needsAsyncInit)

    // Load project or brand defaults on mount
    useEffect(() => {
        const isFromStrategy = searchParams.get('fromStrategy') === '1'
        const templateType = searchParams.get('templateType')
        const templateId = searchParams.get('templateId')
        const fromAttackPlan = searchParams.get('fromAttackPlan')

        // ZMOT Attack Plan — load content from Supabase (no localStorage)
        if (fromAttackPlan && !strategyLoadedRef.current) {
            strategyLoadedRef.current = true
            getAttackPlanLandingDataAction(fromAttackPlan).then((result) => {
                if (result.success && result.data) {
                    const { content, templateType: tplType, projectName } = result.data
                    const freshSections = initializeSections(tplType)
                    const merged = freshSections.map((s: any) => {
                        const gen = content[s.id as string]
                        return gen ? { ...s, content: { ...s.content, ...gen } } : s
                    })
                    store.loadFromStrategy(tplType, merged, projectName)
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
                    store.setProjectName(name)
                    store.setStructureType(structureType)
                    store.setVisualModel(visualModel as 'dark' | 'light')
                    store.setSections(sections as Parameters<typeof store.setSections>[0])
                    store.setCustomColors(colors as DesignColors)
                    store.setMeta(meta)
                    store.setStepIndex(0)
                }
                store.setIsLoading(false)
                setReady(true)
            })
        } else if (templateId && !strategyLoadedRef.current) {
            // Coming from template gallery (with or without strategy AI content)
            strategyLoadedRef.current = true
            // NOTE: No store.reset() here — loadFromStrategy sets all state atomically
            const freshSections = initializeSections(templateId)

            // If fromStrategy=1, try to merge AI content into the template sections
            if (isFromStrategy) {
                const storedContent = typeof window !== 'undefined' ? localStorage.getItem('zentrix_strategy_content') : null
                if (storedContent) {
                    try {
                        const contentJson = JSON.parse(storedContent)
                        const updatedSections = freshSections.map((section: any) => {
                            const generatedData = contentJson[section.id as string]
                            if (generatedData) return { ...section, content: generatedData }
                            return section
                        })
                        store.loadFromStrategy(templateId, updatedSections, `Nuevo - ${getStructureType(templateId).label}`)
                        setTimeout(() => {
                            localStorage.removeItem('zentrix_strategy_content')
                            localStorage.removeItem('zentrix_strategy_type')
                        }, 500)
                    } catch (e) {
                        console.error('[Wizard] Error parsing strategy data for template:', e)
                        store.loadFromStrategy(templateId, freshSections, `Nuevo - ${getStructureType(templateId).label}`)
                    }
                } else {
                    store.loadFromStrategy(templateId, freshSections, `Nuevo - ${getStructureType(templateId).label}`)
                }
            } else {
                store.loadFromStrategy(templateId, freshSections, `Nuevo - ${getStructureType(templateId).label}`)
            }
            setReady(true)

            // Cargar identidad de marca global como default
            getBrandIdentityAction().then((res) => {
                if (res.success && res.data) {
                    const branding = res.data;
                    if (branding.colors && typeof branding.colors === 'object') {
                        store.setCustomColors(branding.colors as DesignColors)
                    }
                }
            })
        } else if (templateId && strategyLoadedRef.current) {
            // React 18 Strict Mode re-run: template already loaded, skip
            return
        } else if (isFromStrategy) {
            // Legacy: fromStrategy sin templateId (directo al wizard viejo)
            // Si ya cargamos los datos de estrategia, no volver a procesar
            // (protege contra React 18 Strict Mode que ejecuta el effect dos veces)
            if (strategyLoadedRef.current) return

            const storedContent = typeof window !== 'undefined' ? localStorage.getItem('zentrix_strategy_content') : null
            const storedType = typeof window !== 'undefined' ? localStorage.getItem('zentrix_strategy_type') : null

            if (storedContent && (templateType || storedType)) {
                try {
                    const contentJson = JSON.parse(storedContent)
                    const type = (templateType || storedType) as ProjectStructureType

                    const freshSections = initializeSections(type)

                    // Debug: log matching between AI output and expected sections
                    const aiKeys = Object.keys(contentJson)
                    const expectedIds = freshSections.map((s: any) => s.id)
                    const missing = expectedIds.filter((id: string) => !contentJson[id])
                    if (missing.length > 0) {
                        console.warn('[Zentrix] Secciones no generadas por IA:', missing)
                        console.warn('[Zentrix] Keys recibidas:', aiKeys)
                    }
                    console.log('[Zentrix] Content recibido:', JSON.stringify(contentJson).substring(0, 500))

                    const updatedSections = freshSections.map((section: any) => {
                        const generatedData = contentJson[section.id]
                        if (generatedData) {
                            return { ...section, content: generatedData }
                        }
                        return section
                    })

                    // Actualización atómica: structureType + sections + name + stepIndex en un solo set()
                    store.loadFromStrategy(type, updatedSections, `Landing - ${type.toUpperCase()}`)

                    // Marcar como cargado ANTES de limpiar localStorage
                    strategyLoadedRef.current = true

                    // Limpiar después de un breve delay para sobrevivir Strict Mode
                    setTimeout(() => {
                        localStorage.removeItem('zentrix_strategy_content')
                        localStorage.removeItem('zentrix_strategy_type')
                    }, 500)
                } catch (e) {
                    console.error('[Zentrix] Error parsing strategy data:', e)
                    store.reset(false)
                }
            } else {
                console.warn('[Zentrix] fromStrategy=1 pero no hay datos en localStorage')
                store.reset(false)
            }
            setReady(true)
        } else {
            store.reset(false)
            // Cargar identidad de marca global como default
            getBrandIdentityAction().then((res) => {
                if (res.success && res.data) {
                    const branding = res.data;
                    if (branding.colors && typeof branding.colors === 'object') {
                        store.setCustomColors(branding.colors as DesignColors)
                    }
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, searchParams])

    // Handle save (plain save) or publish (save + compile HTML)
    const handleSave = useCallback(async (publish = false) => {
        store.setIsSaving(true)
        const payload = {
            projectId: store.projectId ?? undefined,
            name: store.projectName || 'Nuevo Proyecto',
            structureType: store.structureType,
            visualModel: store.visualModel,
            sections: store.sections,
            colors: store.customColors as Record<string, string>,
            meta: store.meta as Record<string, string>,
        }
        const result = publish
            ? await publishProjectAction(payload)
            : await saveProjectAction(payload)
        store.setIsSaving(false)
        if (!result.success) {
            alert(result.error)
        } else if (result.data) {
            store.setProjectId(result.data.id)
            setPublishedSlug(result.data.slug)
            if (publish) {
                window.open(`/p/${result.data.slug}`, '_blank')
            } else {
                setSavedFeedback(true)
                setTimeout(() => setSavedFeedback(false), 2000)
            }
        }
    }, [store])

    const steps = store.getVisibleSteps()
    const currentStep = store.getCurrentStep()

    if (!ready || store.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--cyan)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Cargando proyecto...</p>
                </div>
            </div>
        )
    }

    // ===== Blueprint Selection Step =====
    if (currentStep === 'type') {
        return (
            <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
                <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-sm transition-all hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </button>
                    <h1 className="font-bold text-white">Nueva Landing Page</h1>
                    <div />
                </div>
                <StepType
                    structureType={store.structureType}
                    setStructureType={(type) => store.setStructureType(type)}
                    projectName={store.projectName}
                    setProjectName={store.setProjectName}
                    visualModel={store.visualModel}
                    setVisualModel={store.setVisualModel}
                    onContinue={() => {
                        if (!store.projectName.trim()) {
                            alert('Ingresa un nombre para el proyecto')
                            return
                        }
                        store.setStepIndex(1)
                    }}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#080b18', fontFamily: '\'Outfit\', sans-serif' }}>
            <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');` }} />
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', height: '56px', background: '#0c1024', borderBottom: '1px solid #1e2540', flexShrink: 0 }}>
                <button
                    onClick={() => router.push('/dashboard')}
                    style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#5d7099', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5d7099')}
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>

                <input
                    value={store.projectName}
                    onChange={(e) => store.setProjectName(e.target.value)}
                    placeholder="Nombre del proyecto"
                    maxLength={80}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', minWidth: 0 }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                        onClick={() => store.setShowMobilePreview(!store.showMobilePreview)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: '#151d38', border: '1px solid #2a3050', color: '#8b9ec7', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                        className="lg:hidden"
                    >
                        <Monitor className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                        onClick={() => store.setShowPersonalization(!store.showPersonalization)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: '#151d38', border: '1px solid #2a3050', color: '#8b9ec7', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        <Palette className="w-3.5 h-3.5" /> Diseño
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={store.isSaving}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', background: savedFeedback ? '#064e3b' : '#151d38', border: `1px solid ${savedFeedback ? '#10b981' : '#2a3050'}`, color: savedFeedback ? '#34d399' : '#8b9ec7', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: store.isSaving ? 0.6 : 1, transition: 'all 0.3s' }}
                    >
                        {store.isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {savedFeedback ? 'Guardado' : 'Guardar'}
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={store.isSaving}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #FF007F, #0099ff)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: store.isSaving ? 0.6 : 1 }}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Publicar
                    </button>
                    {publishedSlug && (
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/p/${publishedSlug}`)
                                alert('URL copiada al portapapeles')
                            }}
                            title={`/p/${publishedSlug}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', background: '#0d2818', border: '1px solid #1a4d2e', color: '#34d399', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            <Copy className="w-3 h-3" /> URL
                        </button>
                    )}
                </div>
            </header>

            {/* Progress */}
            <WizardProgressBar
                steps={steps}
                currentStepIndex={store.currentStepIndex}
                onStepClick={store.setStepIndex}
            />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* Editor Column */}
                <div
                    className={store.showMobilePreview ? 'hidden lg:flex' : 'flex'}
                    style={{ flex: 1, flexDirection: 'column', overflowY: 'auto', background: '#0a0e1a' }}
                >
                    <main style={{ flex: 1, maxWidth: '520px', width: '100%', margin: '0 auto', padding: '24px 20px 120px' }}>
                        {/* Content Card */}
                        <div style={{ borderRadius: '14px', padding: '24px', background: '#0f1425', border: '1px solid #1e2847' }}>
                            <StepContent step={currentStep} />
                        </div>
                    </main>

                    {/* Bottom Navigation */}
                    <footer style={{ position: 'sticky', bottom: 0, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0c1024', borderTop: '1px solid #1e2540' }}>
                        <button
                            onClick={store.prevStep}
                            disabled={store.currentStepIndex === 0}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: '#151d38', border: '1px solid #2a3050', color: '#8b9ec7', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: store.currentStepIndex === 0 ? 0.3 : 1, fontFamily: 'inherit' }}
                        >
                            <ArrowLeft className="w-4 h-4" /> Anterior
                        </button>
                        <span style={{ fontSize: '12px', color: '#3d4f6e', fontWeight: 600 }}>
                            {store.currentStepIndex + 1} / {steps.length}
                        </span>
                        <button
                            onClick={store.nextStep}
                            disabled={store.currentStepIndex === steps.length - 1}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #FF007F, #0099ff)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: store.currentStepIndex === steps.length - 1 ? 0.3 : 1, fontFamily: 'inherit' }}
                        >
                            Siguiente <ArrowRight className="w-4 h-4" />
                        </button>
                    </footer>
                </div>

                {/* Preview Column */}
                <div className={`flex-1 border-l relative flex flex-col ${store.showMobilePreview ? 'fixed inset-0 z-50 lg:static lg:flex' : 'hidden lg:flex overflow-hidden'}`}
                    style={{ borderColor: 'var(--border)', background: '#000' }}>

                    {/* Device Toggle Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px 12px', background: '#0c1024', borderBottom: '1px solid #1e2540', flexShrink: 0 }}>
                        {store.showMobilePreview && (
                            <button onClick={() => store.setShowMobilePreview(false)}
                                style={{ position: 'absolute', left: '12px', padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#5d7099', cursor: 'pointer' }}
                                className="lg:hidden">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setPreviewDevice('desktop')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '5px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                                background: previewDevice === 'desktop' ? '#1e2847' : 'transparent',
                                color: previewDevice === 'desktop' ? '#00F0FF' : '#5d7099',
                            }}
                        >
                            <Monitor className="w-3.5 h-3.5" /> Desktop
                        </button>
                        <button
                            onClick={() => setPreviewDevice('mobile')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '5px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                                background: previewDevice === 'mobile' ? '#1e2847' : 'transparent',
                                color: previewDevice === 'mobile' ? '#00F0FF' : '#5d7099',
                            }}
                        >
                            <Smartphone className="w-3.5 h-3.5" /> Mobile
                        </button>
                    </div>

                    {/* Preview Content */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {previewDevice === 'mobile' ? (
                            <div style={{
                                width: '390px', height: 'calc(100% - 48px)',
                                borderRadius: '40px', border: '4px solid #2a3050',
                                overflow: 'hidden', position: 'relative', flexShrink: 0,
                                boxShadow: '0 0 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
                                display: 'flex', flexDirection: 'column',
                            }}>
                                {/* Notch */}
                                <div style={{
                                    height: '28px', background: '#0c1024', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <div style={{ width: '120px', height: '5px', borderRadius: '99px', background: '#1e2540' }} />
                                </div>
                                {/* Scrollable preview */}
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <IframePreview isMobile />
                                </div>
                                {/* Home indicator */}
                                <div style={{
                                    height: '20px', background: '#0c1024', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <div style={{ width: '100px', height: '4px', borderRadius: '99px', background: '#2a3050' }} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                                <IframePreview />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Personalization Sidebar */}
            {store.showPersonalization && (
                <PersonalizationSidebar
                    visualModel={store.visualModel}
                    setVisualModel={store.setVisualModel}
                    customColors={store.customColors}
                    setCustomColors={store.setCustomColors}
                    sections={store.sections}
                    toggleVisibility={store.toggleSectionVisibility}
                    moveSection={store.moveSection}
                    onClose={() => store.setShowPersonalization(false)}
                    structureType={store.structureType}
                    projectName={store.projectName}
                />
            )}
        </div>
    )
}
