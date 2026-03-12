export default function IntelligenceLoading() {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header skeleton */}
            <div
                style={{
                    padding: '1rem 2rem',
                    borderBottom: '1px solid #1e2540',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                }}
            >
                <div
                    style={{ width: 24, height: 24, borderRadius: '50%', background: '#1e2540' }}
                />
                <div>
                    <div
                        style={{
                            width: 120,
                            height: 14,
                            borderRadius: 4,
                            background: '#1e2540',
                            marginBottom: 4,
                        }}
                    />
                    <div
                        style={{ width: 200, height: 10, borderRadius: 4, background: '#151a30' }}
                    />
                </div>
            </div>

            {/* Body skeleton */}
            <div style={{ display: 'flex', flex: 1 }}>
                {/* Sidebar skeleton */}
                <div style={{ width: 240, borderRight: '1px solid #1e2540', padding: '1rem' }}>
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            style={{
                                height: 48,
                                borderRadius: 6,
                                background: '#151a30',
                                marginBottom: 8,
                            }}
                        />
                    ))}
                </div>

                {/* Content skeleton */}
                <div style={{ flex: 1, padding: '1.5rem 2rem' }}>
                    <div
                        style={{
                            width: '60%',
                            height: 20,
                            borderRadius: 6,
                            background: '#1e2540',
                            marginBottom: 16,
                        }}
                    />
                    <div
                        style={{
                            width: '100%',
                            height: 100,
                            borderRadius: 10,
                            background: '#151a30',
                            marginBottom: 16,
                        }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ height: 80, borderRadius: 8, background: '#151a30' }} />
                        <div style={{ height: 80, borderRadius: 8, background: '#151a30' }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
