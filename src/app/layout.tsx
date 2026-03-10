import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: {
        template: '%s | BrandVortix',
        default: 'BrandVortix — Fábrica de Landing Pages',
    },
    description:
        'Crea landing pages estáticas ultra-rápidas y desplegalas en WordPress con un clic.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                {children}
                <Toaster
                    theme="dark"
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#0f1425',
                            border: '1px solid #1e2540',
                            color: '#e2e8f0',
                        },
                    }}
                />
            </body>
        </html>
    )
}
