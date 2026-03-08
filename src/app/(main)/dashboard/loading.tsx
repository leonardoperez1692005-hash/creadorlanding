export default function DashboardLoading() {
    return (
        <div style={{ padding: '32px' }} className="animate-pulse">
            {/* Header skeleton */}
            <div style={{ marginBottom: '32px' }}>
                <div className="h-3 w-24 rounded bg-white/5 mb-3" />
                <div className="h-8 w-64 rounded bg-white/10 mb-2" />
                <div className="h-4 w-48 rounded bg-white/5" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-28 rounded-2xl"
                        style={{
                            background: 'var(--bg-card, #111)',
                            border: '1px solid var(--border, #222)',
                        }}
                    />
                ))}
            </div>

            {/* Projects list */}
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-20 rounded-2xl"
                        style={{
                            background: 'var(--bg-card, #111)',
                            border: '1px solid var(--border, #222)',
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
