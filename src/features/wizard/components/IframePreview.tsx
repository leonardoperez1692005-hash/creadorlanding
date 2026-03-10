'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { useWizardStore } from '../store/wizardStore'
import { compileLandingHtml } from '../lib/htmlCompiler'
import { logger } from '@/shared/lib/logger'

// Override reveal animations so all content is visible at a glance in preview.
// Also force instant scroll-behavior so hash-based scroll isn't animated.
const PREVIEW_OVERRIDES = `<style>.reveal{opacity:1!important;transform:none!important;transition:none!important}html{scroll-behavior:auto!important}</style>`

function injectPreviewOverrides(html: string): string {
    return html.replace('</head>', `${PREVIEW_OVERRIDES}</head>`)
}

interface IframePreviewProps {
    isMobile?: boolean
}

export function IframePreview({ isMobile = false }: IframePreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const blobUrlRef = useRef<string | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
    const isFirstRender = useRef(true)
    const [ready, setReady] = useState(false)

    // Individual selectors to avoid re-renders from unrelated state changes
    const sections = useWizardStore((s) => s.sections)
    const customColors = useWizardStore((s) => s.customColors)
    const visualModel = useWizardStore((s) => s.visualModel)
    const projectName = useWizardStore((s) => s.projectName)
    const projectId = useWizardStore((s) => s.projectId)
    const meta = useWizardStore((s) => s.meta)
    const currentStepIndex = useWizardStore((s) => s.currentStepIndex)
    const getVisibleSteps = useWizardStore((s) => s.getVisibleSteps)

    // Compute current step from index + visible steps
    const currentStep = useMemo(() => {
        const steps = getVisibleSteps()
        return steps[currentStepIndex] ?? 'review'
    }, [getVisibleSteps, currentStepIndex])

    // Strip tracking scripts for preview (no analytics firing)
    const previewMeta = useMemo(
        () => ({
            seo_title: meta.seo_title,
        }),
        [meta.seo_title],
    )

    // Build compile input (does NOT depend on currentStep to avoid extra recompiles)
    const compileInput = useMemo(
        () => ({
            projectId: projectId || 'preview',
            projectName: projectName || 'Mi Landing Page',
            visualModel: visualModel as 'dark' | 'light',
            sections,
            colors: customColors,
            meta: previewMeta,
            baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
        }),
        [projectId, projectName, visualModel, sections, customColors, previewMeta],
    )

    // Resolve the DOM id of the section being edited so the preview auto-scrolls to it
    const scrollTargetId = useMemo(() => {
        const nonSectionSteps = new Set(['type', 'tracking', 'review', 'header'])
        if (nonSectionSteps.has(currentStep)) return undefined
        // Find the section object to get its real id (UUID used as HTML id)
        const section = sections.find((s) => s.type === currentStep || s.id === currentStep)
        return section?.id
    }, [currentStep, sections])

    // Clean up blob URLs on unmount
    useEffect(() => {
        return () => {
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
        }
    }, [])

    // Compile and update iframe using Blob URL (avoids parent CSP blocking inline scripts)
    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe) return

        const compile = (): string => {
            try {
                return injectPreviewOverrides(compileLandingHtml(compileInput))
            } catch (e) {
                logger.error('wizard', 'compileLandingHtml error', e)
                return `<html><body style="font-family:sans-serif;color:#f1f5f9;background:#0a0e1a;padding:24px;"><p style="opacity:.6;font-size:14px">Error al compilar el preview — revisá la consola.</p></body></html>`
            }
        }

        const updateIframe = () => {
            // Revoke previous blob URL to prevent memory leaks
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)

            const html = compile()
            const blob = new Blob([html], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            blobUrlRef.current = url

            // Append hash for auto-scroll to active section (browser-native, no JS needed)
            iframe.src = scrollTargetId ? `${url}#${scrollTargetId}` : url
        }

        // First render: compile immediately (no debounce)
        if (isFirstRender.current) {
            isFirstRender.current = false
            updateIframe()
            // Mark ready via microtask to avoid synchronous setState in effect body
            queueMicrotask(() => setReady(true))
            return
        }

        // Subsequent updates: debounce 350ms
        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(updateIframe, 350)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [compileInput, scrollTargetId])

    const handleLoad = () => {
        if (!ready) setReady(true)
    }

    return (
        <iframe
            ref={iframeRef}
            title="Preview"
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={handleLoad}
            style={{
                width: isMobile ? '390px' : '100%',
                height: '100%',
                border: 'none',
                background: visualModel === 'dark' ? '#0A0E1A' : '#F9FAFB',
                opacity: ready ? 1 : 0,
                transition: 'opacity 0.2s ease',
            }}
        />
    )
}
