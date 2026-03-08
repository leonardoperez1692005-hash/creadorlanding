export default function LeadsLoading() {
    return (
        <div className="max-w-5xl mx-auto py-12 px-6 animate-pulse">
            {/* Header skeleton */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-8 rounded-full bg-white/10" />
                    <div className="h-8 w-48 rounded bg-white/10" />
                </div>
                <div className="h-4 w-72 rounded bg-white/5 mt-2" />
            </div>

            {/* Project cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-24 rounded-2xl"
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
