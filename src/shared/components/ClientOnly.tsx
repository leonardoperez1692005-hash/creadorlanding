'use client'

import dynamic from 'next/dynamic'

const Spinner = () => (
    <div className="h-screen flex items-center justify-center">
        <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#00F0FF' }}
        />
    </div>
)

// ── Lazy client-only wrappers (ssr: false is only allowed in Client Components) ──

export const LazyWizardClient = dynamic(
    () => import('@/features/wizard/components/WizardClient').then((m) => m.WizardClient),
    { ssr: false, loading: Spinner },
)

export const LazyAttackPlanClient = dynamic(
    () =>
        import('@/features/attack-plan/components/AttackPlanClient').then(
            (m) => m.AttackPlanClient,
        ),
    { ssr: false, loading: Spinner },
)

export const LazyPoliticalIntelClient = dynamic(
    () =>
        import('@/features/political-intel/components/PoliticalIntelClient').then(
            (m) => m.PoliticalIntelClient,
        ),
    { ssr: false, loading: Spinner },
)

export const LazyOnboardingFlow = dynamic(
    () => import('@/features/onboarding/components/OnboardingFlow').then((m) => m.OnboardingFlow),
    { ssr: false, loading: Spinner },
)

export { Spinner }
