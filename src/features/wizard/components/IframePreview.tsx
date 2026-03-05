'use client'

import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { useWizardStore } from '../store/wizardStore'
import { compileLandingHtml } from '../lib/htmlCompiler'

interface IframePreviewProps {
    isMobile?: boolean
}

export function IframePreview({ isMobile = false }: IframePreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const scrollPosRef = useRef(0)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
    const isFirstRender = useRef(true)
    const [ready, setReady] = useState(false)

    // Individual selectors to avoid re-renders from unrelated state changes
    const sections = useWizardStore(s => s.sections)
    const customColors = useWizardStore(s => s.customColors)
    const visualModel = useWizardStore(s => s.visualModel)
    const projectName = useWizardStore(s => s.projectName)
    const projectId = useWizardStore(s => s.projectId)
    const meta = useWizardStore(s => s.meta)

    // Strip tracking scripts for preview (no analytics firing)
    const previewMeta = useMemo(() => ({
        seo_title: meta.seo_title,
    }), [meta.seo_title])

    // Build compile input
    const compileInput = useMemo(() => ({
        projectId: projectId || 'preview',
        projectName: projectName || 'Mi Landing Page',
        visualModel: visualModel as 'dark' | 'light',
        sections,
        colors: customColors,
        meta: previewMeta,
        baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
    }), [projectId, projectName, visualModel, sections, customColors, previewMeta])

    // Compile and update iframe
    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe) return

        // Save scroll position before update
        try {
            scrollPosRef.current = iframe.contentWindow?.scrollY ?? 0
        } catch { /* srcdoc same-origin, but guard anyway */ }

        // First render: compile immediately (no debounce)
        if (isFirstRender.current) {
            isFirstRender.current = false
            const html = compileLandingHtml(compileInput)
            iframe.srcdoc = html
            setReady(true)
            return
        }

        // Subsequent updates: debounce 350ms
        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(() => {
            const html = compileLandingHtml(compileInput)
            iframe.srcdoc = html
        }, 350)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [compileInput])

    // Restore scroll position after iframe loads new content
    const handleLoad = useCallback(() => {
        const iframe = iframeRef.current
        if (iframe?.contentWindow && scrollPosRef.current > 0) {
            iframe.contentWindow.scrollTo(0, scrollPosRef.current)
        }
        if (!ready) setReady(true)
    }, [ready])

    return (
        <iframe
            ref={iframeRef}
            title="Preview"
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
