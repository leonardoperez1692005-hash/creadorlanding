'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// === Schemas ===
const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
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
export async function loginAction(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error) {
        return { success: false, error: 'Email o contraseña incorrectos' }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function registerAction(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const parsed = registerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
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
        if (error.message.includes('already registered')) {
            return { success: false, error: 'Este email ya tiene una cuenta registrada' }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function logoutAction(): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
