import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
    let user = null
    try {
        const supabase = await createClient()
        const { data } = await supabase.auth.getUser()
        user = data.user
    } catch {
        // Supabase unavailable — treat as unauthenticated
    }

    if (!user) redirect('/login')
    redirect('/dashboard')
}
