'use client'

import { useEffect, useCallback, useState } from 'react'
import { logger } from '@/shared/lib/logger'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    ArrowRight,
    Save,
    Check,
    Palette,
    Monitor,
    Loader2,
    Smartphone,
    ExternalLink,
    Copy,
    Undo2,
    Redo2,
} from 'lucide-react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import {
    useWizardStore,
    selectProjectName,
    selectStructureType,
    selectVisualModel,
    selectCurrentStepIndex,
    selectIsSaving,
    selectIsLoading,
    selectShowPersonalization,
    selectShowMobilePreview,
    selectSections,
    selectCustomColors,
} from '../store/wizardStore'
import { StepType } from './StepType'
import { StepContent } from './StepContent'
import { WizardProgressBar } from './WizardProgressBar'
import { PersonalizationSidebar } from './PersonalizationSidebar'
import { IframePreview } from './IframePreview'
import { FullPreviewModal } from './FullPreviewModal'
import { useWizardInit } from '../hooks/useWizardInit'
import { saveProjectAction, publishProjectAction } from '../actions'

interface WizardClientProps {
    projectId?: string
}

export function WizardClient({ projectId }: WizardClientProps) {
    const router = useRouter()
    // ─── Granular state selectors (avoid full-store re-renders) ──
    const projectName = useWizardStore(selectProjectName)
    const structureType = useWizardStore(selectStructureType)
    const visualModel = useWizardStore(selectVisualModel)
    const currentStepIndex = useWizardStore(selectCurrentStepIndex)
    const isSaving = useWizardStore(selectIsSaving)
    const isLoading = useWizardStore(selectIsLoading)
    const showPersonalization = useWizardStore(selectShowPersonalization)
    const showMobilePreview = useWizardStore(selectShowMobilePreview)
    const sections = useWizardStore(selectSections)
    const customColors = useWizardStore(selectCustomColors)

    // ─── Computed selectors ──────────────────────────────────────
    const steps = useWizardStore(useShallow((s) => s.getVisibleSteps()))
    const currentStep = useWizardStore((s) => s.getCurrentStep())

    // ─── Actions (stable refs, grouped to reduce hook calls) ────
    const actions = useWizardStore(
        useShallow((s) => ({
            setProjectName: s.setProjectName,
            setStructureType: s.setStructureType,
            setVisualModel: s.setVisualModel,
            setStepIndex: s.setStepIndex,
            setShowPersonalization: s.setShowPersonalization,
            setShowMobilePreview: s.setShowMobilePreview,
            nextStep: s.nextStep,
            prevStep: s.prevStep,
            setCustomColors: s.setCustomColors,
            toggleSectionVisibility: s.toggleSectionVisibility,
            moveSection: s.moveSection,
            addSection: s.addSection,
            removeSection: s.removeSection,
            applyPresetTheme: s.applyPresetTheme,
        })),
    )

    const { undo, redo, pastStates, futureStates } = useStore(
        useWizardStore.temporal,
        useShallow((s) => ({
            undo: s.undo,
            redo: s.redo,
            pastStates: s.pastStates,
            futureStates: s.futureStates,
        })),
    )
    const { ready } = useWizardInit(projectId)

    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
    const [showFullPreview, setShowFullPreview] = useState(false)
    const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
    const [savedFeedback, setSavedFeedback] = useState(false)

    // Warn before leaving with unsaved changes
    const hasChanges = pastStates.length > 0
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (hasChanges) e.preventDefault()
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [hasChanges])

    const navigateDashboard = useCallback(() => {
        if (hasChanges && !window.confirm('Tenés cambios sin guardar. ¿Salir sin guardar?')) return
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('bv_wizard_draft')
        router.push('/dashboard')
    }, [hasChanges, router])

    // Undo/Redo keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault()
                if (e.shiftKey) redo()
                else undo()
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault()
                redo()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [undo, redo])

    // Handle save (plain save) or publish (save + compile HTML)
    const handleSave = useCallback(async (publish = false) => {
        const state = useWizardStore.getState()
        state.setIsSaving(true)
        const isNewProject = !state.projectId
        const payload = {
            projectId: state.projectId ?? undefined,
            name: state.projectName || 'Nuevo Proyecto',
            structureType: state.structureType,
            visualModel: state.visualModel,
            sections: state.sections,
            colors: state.customColors as Record<string, string>,
            meta: state.meta as Record<string, string>,
        }
        try {
            const result = publish
                ? await publishProjectAction(payload)
                : await saveProjectAction(payload)
            state.setIsSaving(false)
            if (!result.success) {
                alert(result.error)
            } else if (result.data) {
                state.setProjectId(result.data.id)
                setPublishedSlug(result.data.slug)
                if (typeof sessionStorage !== 'undefined')
                    sessionStorage.removeItem('bv_wizard_draft')
                if (isNewProject) {
                    window.history.replaceState({}, '', `/wizard?projectId=${result.data.id}`)
                }
                if (publish) {
                    window.open(`/p/${result.data.slug}`, '_blank')
                } else {
                    setSavedFeedback(true)
                    setTimeout(() => setSavedFeedback(false), 2000)
                }
            }
        } catch (e) {
            useWizardStore.getState().setIsSaving(false)
            alert('Error al guardar. Intentá de nuevo.')
            logger.error('wizard', 'handleSave threw', e)
        }
    }, [])

    if (!ready || isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'var(--bg-primary)' }}
            >
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
                <div
                    className="border-b px-6 py-4 flex items-center justify-between"
                    style={{ borderColor: 'var(--border)' }}
                >
                    <button
                        onClick={navigateDashboard}
                        className="flex items-center gap-2 text-sm transition-all hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </button>
                    <h1 className="font-bold text-white">Nueva Landing Page</h1>
                    <div />
                </div>
                <StepType
                    structureType={structureType}
                    setStructureType={actions.setStructureType}
                    projectName={projectName}
                    setProjectName={actions.setProjectName}
                    visualModel={visualModel}
                    setVisualModel={actions.setVisualModel}
                    onContinue={() => {
                        if (!projectName.trim()) {
                            alert('Ingresa un nombre para el proyecto')
                            return
                        }
                        actions.setStepIndex(1)
                    }}
                />
            </div>
        )
    }

    return (
        <div
            className="flex flex-col h-screen overflow-hidden"
            style={{ background: '#080b18', fontFamily: "'Outfit', sans-serif" }}
        >
            <style
                dangerouslySetInnerHTML={{
                    __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');`,
                }}
            />
            {/* Header */}
            <header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0 16px',
                    height: '56px',
                    background: '#0c1024',
                    borderBottom: '1px solid #1e2540',
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={navigateDashboard}
                    style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#5d7099',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5d7099')}
                    aria-label="Volver al dashboard"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>

                <input
                    value={projectName}
                    onChange={(e) => actions.setProjectName(e.target.value)}
                    placeholder="Nombre del proyecto"
                    aria-label="Nombre del proyecto"
                    maxLength={80}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        minWidth: 0,
                    }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            marginRight: '4px',
                        }}
                    >
                        <button
                            onClick={() => undo()}
                            disabled={pastStates.length === 0}
                            title="Deshacer (Ctrl+Z)"
                            aria-label="Deshacer"
                            style={{
                                padding: '6px',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: pastStates.length > 0 ? '#8b9ec7' : '#2a3050',
                                cursor: pastStates.length > 0 ? 'pointer' : 'default',
                                fontFamily: 'inherit',
                            }}
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => redo()}
                            disabled={futureStates.length === 0}
                            title="Rehacer (Ctrl+Shift+Z)"
                            aria-label="Rehacer"
                            style={{
                                padding: '6px',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: futureStates.length > 0 ? '#8b9ec7' : '#2a3050',
                                cursor: futureStates.length > 0 ? 'pointer' : 'default',
                                fontFamily: 'inherit',
                            }}
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowFullPreview(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#151d38',
                            border: '1px solid #2a3050',
                            color: '#8b9ec7',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        <Monitor className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                        onClick={() => actions.setShowPersonalization(!showPersonalization)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#151d38',
                            border: '1px solid #2a3050',
                            color: '#8b9ec7',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        <Palette className="w-3.5 h-3.5" /> Diseño
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: savedFeedback ? '#064e3b' : '#151d38',
                            border: `1px solid ${savedFeedback ? '#10b981' : '#2a3050'}`,
                            color: savedFeedback ? '#34d399' : '#8b9ec7',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            opacity: isSaving ? 0.6 : 1,
                            transition: 'all 0.3s',
                        }}
                    >
                        {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : savedFeedback ? (
                            <Check className="w-3.5 h-3.5" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        {savedFeedback ? 'Guardado' : 'Guardar'}
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={isSaving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #FF007F, #0099ff)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            opacity: isSaving ? 0.6 : 1,
                        }}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Publicar
                    </button>
                    {publishedSlug && (
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    `${window.location.origin}/p/${publishedSlug}`,
                                )
                                alert('URL copiada al portapapeles')
                            }}
                            title={`/p/${publishedSlug}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: '#0d2818',
                                border: '1px solid #1a4d2e',
                                color: '#34d399',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            <Copy className="w-3 h-3" /> URL
                        </button>
                    )}
                </div>
            </header>

            {/* Progress */}
            <WizardProgressBar
                steps={steps}
                currentStepIndex={currentStepIndex}
                onStepClick={actions.setStepIndex}
            />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* Editor Column */}
                <div
                    className={showMobilePreview ? 'hidden lg:flex' : 'flex'}
                    style={{
                        flex: 1,
                        flexDirection: 'column',
                        overflowY: 'auto',
                        background: '#0a0e1a',
                    }}
                >
                    <main
                        style={{
                            flex: 1,
                            maxWidth: '520px',
                            width: '100%',
                            margin: '0 auto',
                            padding: '24px 20px 120px',
                        }}
                    >
                        <div
                            style={{
                                borderRadius: '14px',
                                padding: '24px',
                                background: '#0f1425',
                                border: '1px solid #1e2847',
                            }}
                        >
                            <StepContent step={currentStep} />
                        </div>
                    </main>

                    <footer
                        style={{
                            position: 'sticky',
                            bottom: 0,
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#0c1024',
                            borderTop: '1px solid #1e2540',
                        }}
                    >
                        <button
                            onClick={actions.prevStep}
                            disabled={currentStepIndex === 0}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: '#151d38',
                                border: '1px solid #2a3050',
                                color: '#8b9ec7',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                opacity: currentStepIndex === 0 ? 0.3 : 1,
                                fontFamily: 'inherit',
                            }}
                        >
                            <ArrowLeft className="w-4 h-4" /> Anterior
                        </button>
                        <span style={{ fontSize: '12px', color: '#3d4f6e', fontWeight: 600 }}>
                            {currentStepIndex + 1} / {steps.length}
                        </span>
                        <button
                            onClick={actions.nextStep}
                            disabled={currentStepIndex === steps.length - 1}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 20px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #FF007F, #0099ff)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                opacity: currentStepIndex === steps.length - 1 ? 0.3 : 1,
                                fontFamily: 'inherit',
                            }}
                        >
                            Siguiente <ArrowRight className="w-4 h-4" />
                        </button>
                    </footer>
                </div>

                {/* Preview Column */}
                <div
                    className={`flex-1 border-l relative flex flex-col ${showMobilePreview ? 'fixed inset-0 z-50 lg:static lg:flex' : 'hidden lg:flex overflow-hidden'}`}
                    style={{ borderColor: 'var(--border)', background: '#000' }}
                >
                    {/* Device Toggle Bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '8px 12px',
                            background: '#0c1024',
                            borderBottom: '1px solid #1e2540',
                            flexShrink: 0,
                        }}
                    >
                        {showMobilePreview && (
                            <button
                                onClick={() => actions.setShowMobilePreview(false)}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#5d7099',
                                    cursor: 'pointer',
                                }}
                                className="lg:hidden"
                                aria-label="Volver al editor"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setPreviewDevice('desktop')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 14px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                border: 'none',
                                background: previewDevice === 'desktop' ? '#1e2847' : 'transparent',
                                color: previewDevice === 'desktop' ? '#00F0FF' : '#5d7099',
                            }}
                        >
                            <Monitor className="w-3.5 h-3.5" /> Desktop
                        </button>
                        <button
                            onClick={() => setPreviewDevice('mobile')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 14px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                border: 'none',
                                background: previewDevice === 'mobile' ? '#1e2847' : 'transparent',
                                color: previewDevice === 'mobile' ? '#00F0FF' : '#5d7099',
                            }}
                        >
                            <Smartphone className="w-3.5 h-3.5" /> Mobile
                        </button>
                    </div>

                    {/* Preview Content */}
                    <div
                        style={{
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {previewDevice === 'mobile' ? (
                            <div
                                style={{
                                    width: '390px',
                                    height: 'calc(100% - 48px)',
                                    borderRadius: '40px',
                                    border: '4px solid #2a3050',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    flexShrink: 0,
                                    boxShadow:
                                        '0 0 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <div
                                    style={{
                                        height: '28px',
                                        background: '#0c1024',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '120px',
                                            height: '5px',
                                            borderRadius: '99px',
                                            background: '#1e2540',
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <IframePreview isMobile />
                                </div>
                                <div
                                    style={{
                                        height: '20px',
                                        background: '#0c1024',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100px',
                                            height: '4px',
                                            borderRadius: '99px',
                                            background: '#2a3050',
                                        }}
                                    />
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

            {showFullPreview && <FullPreviewModal onClose={() => setShowFullPreview(false)} />}

            {showPersonalization && (
                <PersonalizationSidebar
                    visualModel={visualModel}
                    setVisualModel={actions.setVisualModel}
                    customColors={customColors}
                    setCustomColors={actions.setCustomColors}
                    sections={sections}
                    toggleVisibility={actions.toggleSectionVisibility}
                    moveSection={actions.moveSection}
                    onClose={() => actions.setShowPersonalization(false)}
                    structureType={structureType}
                    projectName={projectName}
                    onAddSection={actions.addSection}
                    onRemoveSection={actions.removeSection}
                    onApplyPreset={actions.applyPresetTheme}
                />
            )}
        </div>
    )
}
