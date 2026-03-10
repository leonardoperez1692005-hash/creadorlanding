'use client'

import { useActionState } from 'react'
import { registerAction, type ActionResponse } from '@/features/auth/actions'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

const initialState: ActionResponse = { success: false, error: '' }

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(registerAction, initialState)

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'var(--bg-primary)' }}
        >
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'var(--purple)' }}
                />
                <div
                    className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'var(--pink)' }}
                />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Image src="/logo.png" alt="BrandVortix" width={48} height={48} />
                        <span
                            className="text-2xl font-bold"
                            style={{
                                background: 'var(--gradient-primary)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            BrandVortix
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Crea tu cuenta</h1>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                        Accede gratis y empieza a construir
                    </p>
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl p-8"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <form action={formAction} className="space-y-5">
                        {/* Error */}
                        {!state.success && 'error' in state && state.error && (
                            <div
                                className="p-3 rounded-lg text-sm text-center"
                                style={{
                                    background: 'rgba(255, 0, 127, 0.1)',
                                    border: '1px solid rgba(255,0,127,0.3)',
                                    color: 'var(--pink)',
                                }}
                            >
                                {state.error}
                            </div>
                        )}

                        {/* Name */}
                        <div>
                            <label
                                htmlFor="reg-name"
                                className="block text-sm font-medium mb-2"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Nombre
                            </label>
                            <input
                                id="reg-name"
                                type="text"
                                name="name"
                                required
                                placeholder="Tu nombre"
                                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 transition-all"
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    outline: 'none',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--input-border-focus)'
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--input-border)'
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="reg-email"
                                className="block text-sm font-medium mb-2"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Email
                            </label>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                required
                                placeholder="tu@email.com"
                                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 transition-all"
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    outline: 'none',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--input-border-focus)'
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--input-border)'
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="reg-password"
                                className="block text-sm font-medium mb-2"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Contraseña
                            </label>
                            <input
                                id="reg-password"
                                type="password"
                                name="password"
                                required
                                placeholder="Mínimo 8 caracteres"
                                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 transition-all"
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    outline: 'none',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--input-border-focus)'
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--input-border)'
                                }}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3 rounded-xl font-semibold text-black flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...
                                </>
                            ) : (
                                'Crear mi cuenta gratis'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        ¿Ya tienes cuenta?{' '}
                        <a
                            href="/login"
                            style={{ color: 'var(--cyan)' }}
                            className="hover:underline"
                        >
                            Inicia sesión
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
