import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '../env'

/** Crea un cliente Supabase server-side con acceso a cookies del request (anon key). */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options),
                    )
                } catch {
                    // Called from a Server Component — ignore
                }
            },
        },
    })
}

/** Crea un cliente Supabase con service role key (bypass RLS, solo para operaciones admin). */
export function createServiceClient() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js')
    return createClient(env.supabaseUrl, env.supabaseServiceKey)
}
