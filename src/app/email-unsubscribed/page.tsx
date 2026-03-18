export default function EmailUnsubscribedPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}): React.ReactElement {
    // Note: searchParams is a Promise in Next.js 16 — but we use a simple static page
    void searchParams

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0E1A] text-white">
            <div className="max-w-md text-center px-6">
                <div className="text-4xl mb-4" aria-hidden="true">
                    📧
                </div>
                <h1 className="text-2xl font-bold mb-3">Desuscripción exitosa</h1>
                <p className="text-white/60 mb-6">
                    Ya no recibirás este tipo de emails. Podés reactivar las notificaciones en
                    cualquier momento desde tu panel de configuración.
                </p>
                <a
                    href="/dashboard"
                    className="inline-block rounded-lg bg-cyan-500 px-6 py-2.5 font-bold text-black hover:bg-cyan-400 transition-colors"
                >
                    Ir al Dashboard
                </a>
            </div>
        </div>
    )
}
