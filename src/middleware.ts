import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function buildCspHeader(): string {
    const isDev = process.env.NODE_ENV === 'development'
    return [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net${isDev ? " 'unsafe-eval'" : ''}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://img.youtube.com https://www.facebook.com https://*.supabase.co",
        "frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com https://calendly.com https://www.google.com",
        "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://www.googletagmanager.com https://connect.facebook.net",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ')
}

export async function middleware(request: NextRequest) {
    try {
        const requestHeaders = new Headers(request.headers)
        const csp = buildCspHeader()

        let supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
        })
        supabaseResponse.headers.set('Content-Security-Policy', csp)

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        // If env vars not available, just pass through with CSP
        if (!supabaseUrl || !supabaseAnonKey) {
            return supabaseResponse
        }

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request: { headers: requestHeaders },
                    })
                    // Re-apply CSP after Supabase recreates the response
                    supabaseResponse.headers.set('Content-Security-Policy', csp)
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    )
                },
            },
        })

        const {
            data: { user },
        } = await supabase.auth.getUser()

        const { pathname } = request.nextUrl

        // Public routes that don't require auth
        const publicRoutes = ['/login', '/register', '/pricing', '/p/']
        const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

        // API routes for WordPress plugin + OAuth callbacks - always public
        const isPublicApi =
            pathname.startsWith('/api/license') ||
            pathname.startsWith('/api/leads/capture') ||
            pathname.startsWith('/api/auth/') ||
            pathname === '/api/health'

        // Published landing pages: relaxed CSP (compiled HTML uses inline scripts/styles)
        if (pathname.startsWith('/p/')) {
            const landingCsp = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
                "img-src 'self' data: blob: https://img.youtube.com https://www.facebook.com https://*.supabase.co",
                "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://calendly.com https://www.google.com",
                "connect-src 'self' https://*.supabase.co https://www.googletagmanager.com https://connect.facebook.net",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ].join('; ')
            supabaseResponse.headers.set('Content-Security-Policy', landingCsp)
            return supabaseResponse
        }

        if (isPublicRoute || isPublicApi) {
            return supabaseResponse
        }

        // Not authenticated → redirect to login
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Authenticated → check if onboarding is needed
        // Skip this check for the onboarding page itself, auth callbacks, and admin
        if (
            !pathname.startsWith('/onboarding') &&
            !pathname.startsWith('/admin') &&
            pathname !== '/auth/callback'
        ) {
            const { data: brandIdentity } = await supabase
                .from('brand_identities')
                .select('is_completed')
                .eq('user_id', user.id)
                .single()

            if (!brandIdentity?.is_completed) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                return NextResponse.redirect(url)
            }
        }

        return supabaseResponse
    } catch {
        // If middleware fails, pass through to avoid blocking the entire site
        return NextResponse.next()
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
