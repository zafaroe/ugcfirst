import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes - no auth required
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/pricing', '/auth/callback']

// Protected routes - require auth
const PROTECTED_ROUTES = ['/dashboard', '/create', '/projects', '/settings', '/explore', '/templates', '/onboarding']

// Auth routes - redirect to dashboard if already logged in
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let API routes pass through - they handle their own auth
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Let auth callback pass through - handles OAuth redirect
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Check WIP flag first (secondary protection layer)
  const isWipEnabled = process.env.NEXT_PUBLIC_ENABLE_WIP_ROUTES === 'true'
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // If WIP disabled and protected route, redirect to home (regardless of auth)
  if (!isWipEnabled && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Create Supabase client for auth check
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Check if on auth route while authenticated -> redirect to dashboard
  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route)
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check if on protected route while not authenticated -> redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
