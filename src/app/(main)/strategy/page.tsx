import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StrategyClient } from '@/features/strategy/components/StrategyClient'

export const metadata: Metadata = {
    title: 'ZentrixOS — Inteligencia Competitiva',
    description: 'Analiza la competencia y genera tu estrategia de ventas con IA y Bright Data',
}

export default async function StrategyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return <StrategyClient />
}
