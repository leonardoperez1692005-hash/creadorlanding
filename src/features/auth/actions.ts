'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/shared/lib/rate-limit'

// === Schemas ===
const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

// === Types ===
export type ActionResponse<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

// === Actions ===

/** Autentica al usuario con email/password, aplicando rate limit de 5 intentos cada 15 min. */
export async function loginAction(
    prevState: ActionResponse,
    formData: FormData,
): Promise<ActionResponse> {
    const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    // Rate limit: 5 attempts per email per 15 minutes
    const rl = rateLimit(`login:${parsed.data.email}`, { limit: 5, windowSec: 900 })
    if (!rl.allowed) {
        return { success: false, error: 'Demasiados intentos. Intentá de nuevo en unos minutos.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error) {
        return { success: false, error: 'Email o contraseña incorrectos' }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

/** Registra un nuevo usuario con rate limit de 3 intentos cada 30 min (previene enumeración). */
export async function registerAction(
    prevState: ActionResponse,
    formData: FormData,
): Promise<ActionResponse> {
    const parsed = registerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    // Rate limit: 3 registrations per email per 30 minutes
    const rl = rateLimit(`register:${parsed.data.email}`, { limit: 3, windowSec: 1800 })
    if (!rl.allowed) {
        return { success: false, error: 'Demasiados intentos de registro. Intentá más tarde.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
            data: { name: parsed.data.name },
        },
    })

    if (error) {
        // Generic message to prevent account enumeration
        return {
            success: false,
            error: 'No se pudo completar el registro. Verificá el email e intentá de nuevo.',
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

/** Cierra la sesión del usuario y redirige a /login. */
export async function logoutAction(): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
