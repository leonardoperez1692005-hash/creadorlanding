'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
    value: string
    onChange: (newValue: string) => void
    className?: string
    multiline?: boolean
}

export function EditableText({ value, onChange, className = '', multiline = false }: Props) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        setDraft(value)
    }, [value])

    useEffect(() => {
        if (!editing) return
        const el = multiline ? textareaRef.current : inputRef.current
        if (el) {
            el.focus()
            el.select()
        }
    }, [editing, multiline])

    function commit() {
        setEditing(false)
        const trimmed = draft.trim()
        if (trimmed && trimmed !== value) onChange(trimmed)
    }

    if (!editing) {
        return (
            <button
                type="button"
                className={`cursor-pointer hover:bg-[var(--bg-secondary)] rounded px-1 -mx-1 transition-colors bg-transparent border-none p-0 text-left text-inherit font-inherit ${className}`}
                onClick={() => setEditing(true)}
                title="Click para editar"
            >
                {value}
            </button>
        )
    }

    const sharedClassName = `w-full bg-[var(--bg-secondary)] border border-[var(--cyan)]/50 rounded px-2 py-1 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--cyan)]`

    if (multiline) {
        return (
            <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                rows={3}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setDraft(value)
                        setEditing(false)
                    }
                }}
                className={`${sharedClassName} resize-y min-h-[60px]`}
            />
        )
    }

    return (
        <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') {
                    setDraft(value)
                    setEditing(false)
                }
            }}
            className={sharedClassName}
        />
    )
}
