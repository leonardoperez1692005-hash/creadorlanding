// ─── Shared Form Styles for Wizard Components ───────────────
// Used by StepGeneric, StepList, AnchorPicker, and similar form components.

import { WIZ } from './theme'

export const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    background: WIZ.bgPanel,
    border: `1px solid ${WIZ.borderInput}`,
    color: WIZ.textPrimary,
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
}

export const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    background: WIZ.bgPanel,
    border: `1px solid ${WIZ.borderInput}`,
    color: WIZ.textSecondary,
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
}

export const selectStyle: React.CSSProperties = {
    ...fieldStyle,
    cursor: 'pointer',
    appearance: 'auto' as const,
    resize: 'none' as const,
}

export const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: WIZ.textMuted,
    marginBottom: '6px',
}

/** Slightly larger label variant (used in StepGeneric) */
export const labelStyleLg: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: WIZ.textLabel,
    marginBottom: '7px',
}

export const onFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) => {
    e.currentTarget.style.borderColor = WIZ.accent
}

export const onBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) => {
    e.currentTarget.style.borderColor = WIZ.borderInput
}

/** Focus handler that also changes background (used in StepGeneric) */
export const onFocusDeep = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = WIZ.accent
    e.currentTarget.style.background = WIZ.bgHover
}

export const onBlurDeep = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = WIZ.borderInput
    e.currentTarget.style.background = WIZ.bgPanel
}
