import { createClient } from '@supabase/supabase-js'
import { TEST_USER } from './helpers'

/**
 * Global setup: creates a confirmed test user via Supabase Admin API.
 * Runs once before all E2E tests.
 */
export default async function globalSetup() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for E2E tests',
        )
    }

    const admin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    // Delete existing test user if present (ensures clean state)
    const { data: users } = await admin.auth.admin.listUsers()
    const existing = users?.users?.find((u) => u.email === TEST_USER.email)

    if (existing) {
        await admin.from('projects').delete().eq('user_id', existing.id)
        await admin.from('brand_identities').delete().eq('user_id', existing.id)
        await admin.from('profiles').delete().eq('id', existing.id)
        await admin.auth.admin.deleteUser(existing.id)
        console.log(`[E2E Setup] Cleaned up existing test user`)
    }

    // Create confirmed user via admin API (bypasses email confirmation)
    const { data, error } = await admin.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true,
        user_metadata: { name: TEST_USER.name },
    })

    if (error) {
        throw new Error(`Failed to create test user: ${error.message}`)
    }

    console.log(`[E2E Setup] Created test user: ${data.user.email} (id: ${data.user.id})`)

    // Create completed brand identity so user skips onboarding → goes to /dashboard
    const { error: brandError } = await admin.from('brand_identities').insert({
        user_id: data.user.id,
        brand_name: 'E2E Test Brand',
        sector: 'Tecnología',
        target_audience: 'Emprendedores digitales que buscan presencia online rápida',
        brand_values: 'Innovación, velocidad, simplicidad',
        business_objective: 'Generar leads y convertir visitantes en clientes',
        colors: {
            primary: '#FF003C',
            secondary: '#0F0F1A',
            accent: '#00F0FF',
            background: '#0A0A14',
        },
        typography: { headings: 'Inter', body: 'Inter' },
        is_completed: true,
        updated_at: new Date().toISOString(),
    })

    if (brandError) {
        console.warn(`[E2E Setup] Warning: could not create brand identity: ${brandError.message}`)
    } else {
        console.log(`[E2E Setup] Created brand identity for test user (onboarding complete)`)
    }
}
