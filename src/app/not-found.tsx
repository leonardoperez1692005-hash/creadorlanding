import Link from 'next/link'

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            <h1 style={{ fontSize: '4rem', fontWeight: 900, opacity: 0.2 }}>404</h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.6 }}>Página no encontrada</p>
            <Link
                href="/"
                style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: '#7C3AED',
                    color: '#fff',
                    fontWeight: 700,
                    textDecoration: 'none',
                }}
            >
                Volver al inicio
            </Link>
        </div>
    )
}
