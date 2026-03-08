import { createClient } from '@supabase/supabase-js'
import { TEST_USER } from './helpers'

/**
 * Global teardown: deletes the test user and all their data.
 * Runs once after all E2E tests complete.
 */
export default async function globalTeardown() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) return

    const admin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    // Find user by email
    const { data: users } = await admin.auth.admin.listUsers()
    const testUser = users?.users?.find((u) => u.email === TEST_USER.email)

    if (testUser) {
        // Delete user's data (cascades via RLS/FK)
        await admin.from('projects').delete().eq('user_id', testUser.id)
        await admin.from('brand_identities').delete().eq('user_id', testUser.id)
        await admin.from('profiles').delete().eq('id', testUser.id)
        // Delete the auth user
        await admin.auth.admin.deleteUser(testUser.id)
        console.log(`[E2E Teardown] Deleted test user: ${TEST_USER.email}`)
    }
}
