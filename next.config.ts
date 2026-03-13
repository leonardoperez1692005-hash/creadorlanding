import type { NextConfig } from 'next'
import path from 'path'
import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
    serverExternalPackages: ['pdfkit', 'jsdom', 'isomorphic-dompurify'],
    turbopack: {
        root: path.resolve(__dirname),
        resolveAlias: {
            tailwindcss: path.resolve(__dirname, 'node_modules/tailwindcss'),
        },
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            { protocol: 'https', hostname: '**.supabase.co' },
            { protocol: 'https', hostname: '**.supabase.in' },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    // CSP is set dynamically in middleware.ts with per-request nonce
                ],
            },
        ]
    },
}

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
    silent: true,
})
