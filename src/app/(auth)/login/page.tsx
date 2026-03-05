'use client'

import { useActionState } from 'react'
import { loginAction } from '@/features/auth/actions'
import { Loader2, Zap } from 'lucide-react'

const initialState = { success: false, error: '' }

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, initialState as any)

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'var(--cyan)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'var(--pink)' }} />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: 'var(--gradient-glow)', border: '1px solid rgba(0,240,255,0.3)' }}>
                            <Zap className="w-6 h-6" style={{ color: 'var(--cyan)' }} />
                        </div>
                        <span className="text-2xl font-bold" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            StaticLaunch
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Bienvenido de vuelta</h1>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                        Accede a tu fábrica de landing pages
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
                    <form action={formAction} className="space-y-5">
                        {/* Error */}
                        {!state.success && (state as any).error && (
                            <div className="p-3 rounded-lg text-sm text-center"
                                style={{ background: 'rgba(255, 0, 127, 0.1)', border: '1px solid rgba(255,0,127,0.3)', color: 'var(--pink)' }}>
                                {(state as any).error}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Email
                            </label>
                            <input
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
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-border-focus)' }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)' }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 transition-all"
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    outline: 'none',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-border-focus)' }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)' }}
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
                                <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</>
                            ) : (
                                'Ingresar al Sistema'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        ¿No tienes cuenta?{' '}
                        <a href="/register" style={{ color: 'var(--cyan)' }} className="hover:underline">
                            Regístrate gratis
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
