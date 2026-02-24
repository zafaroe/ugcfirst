import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that should be hidden in production
const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/create',
  '/settings',
  '/onboarding',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if feature is enabled (defaults to true in development)
  const isWipEnabled = process.env.NEXT_PUBLIC_ENABLE_WIP_ROUTES === 'true'

  // If WIP routes are enabled, allow access
  if (isWipEnabled) {
    return NextResponse.next()
  }

  // Check if current path matches any protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Redirect to home if accessing protected route in production
  if (isProtectedRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/create/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
  ],
}
