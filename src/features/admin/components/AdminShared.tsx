'use client'

import { X } from 'lucide-react'

// =============================================
// SECTION HEADER (for detail modals)
// =============================================
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-3 mt-6 first:mt-0">
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</h4>
            {action}
        </div>
    )
}

// =============================================
// EMPTY STATE
// =============================================
export function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-8 text-center rounded-xl" style={{ border: '1px dashed var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
        </div>
    )
}

// =============================================
// STATUS / ROLE BADGES
// =============================================
const STATUS_STYLES: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    suspended: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
    revoked: 'bg-red-500/15 text-red-400 border-red-500/30',
    expired: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const ROLE_STYLES: Record<string, string> = {
    superadmin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    admin: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    user: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

export function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.inactive}`}>
            {status}
        </span>
    )
}

export function RoleBadge({ role }: { role: string }) {
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_STYLES[role] ?? ROLE_STYLES.user}`}>
            {role}
        </span>
    )
}

// =============================================
// MODAL
// =============================================
interface AdminModalProps {
    title: string
    children: React.ReactNode
    onClose: () => void
    maxWidth?: string
}

export function AdminModal({ title, children, onClose, maxWidth = 'max-w-lg' }: AdminModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}>
            <div className={`w-full ${maxWidth} max-h-[85vh] overflow-auto rounded-2xl shadow-2xl`}
                style={{ background: '#0e1219', border: '1px solid var(--border)' }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    )
}

// =============================================
// CONFIRM MODAL
// =============================================
interface ConfirmModalProps {
    message: string
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
    return (
        <AdminModal title="Confirmar Acción" onClose={onCancel}>
            <p className="mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <div className="flex gap-3 justify-end">
                <button onClick={onCancel}
                    className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    Cancelar
                </button>
                <button onClick={onConfirm}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-80"
                    style={{ background: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.5)' }}>
                    Confirmar
                </button>
            </div>
        </AdminModal>
    )
}

// =============================================
// FORM HELPERS
// =============================================
export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
            {children}
        </div>
    )
}

export const inputClass = [
    'w-full px-3 py-2.5 rounded-lg text-sm text-white',
    'placeholder-gray-600 transition-all outline-none',
].join(' ')

export const inputStyle = {
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
}

export const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--input-border-focus)'
}
export const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--input-border)'
}

// =============================================
// TOAST
// =============================================
interface ToastProps {
    message: string
    type: 'success' | 'error'
}

export function Toast({ message, type }: ToastProps) {
    return (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm shadow-2xl border ${type === 'error'
            ? 'bg-red-900/90 border-red-600/50 text-red-200'
            : 'bg-emerald-900/90 border-emerald-600/50 text-emerald-200'
            }`}>
            {message}
        </div>
    )
}

// =============================================
// SEARCH BAR
// =============================================
export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input value={value} onChange={(e) => onChange(e.target.value)}
                placeholder="Buscar..." spellCheck={false}
                className={`${inputClass} pl-10 pr-8`} style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
            />
            {value && (
                <button onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-all hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}>
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}

// =============================================
// ADMIN TABLE WRAPPER
// =============================================
export function AdminTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`overflow-x-auto rounded-xl ${className}`} style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm min-w-[600px]">
                {children}
            </table>
        </div>
    )
}

export function Th({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            {children}
        </th>
    )
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <td className={`px-4 py-3 ${className}`} style={{ borderBottom: '1px solid var(--border)' }}>
            {children}
        </td>
    )
}

export function Tr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    return (
        <tr className="transition-all hover:bg-white/[0.02]" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
            {children}
        </tr>
    )
}
