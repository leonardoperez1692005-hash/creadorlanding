import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Public routes that don't require auth
    const publicRoutes = ['/login', '/register', '/pricing']
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    // API routes for WordPress plugin - always public
    const isPublicApi = pathname.startsWith('/api/license') || pathname.startsWith('/api/leads/capture')

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
    if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/admin') && pathname !== '/auth/callback') {
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
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
