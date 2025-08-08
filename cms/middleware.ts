/**
 * Next.js middleware for authentication and route protection
 * Handles authentication checks and redirects
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Allow access to public routes
    if (req.nextUrl.pathname.startsWith('/auth/')) {
      return NextResponse.next()
    }

    // Allow access to API health check
    if (req.nextUrl.pathname === '/api/health') {
      return NextResponse.next()
    }

    // Allow access to public API routes (if any)
    if (req.nextUrl.pathname.startsWith('/api/public/')) {
      return NextResponse.next()
    }

    // Require authentication for all other routes
    if (!req.nextauth.token) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes without authentication
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true
        }

        if (req.nextUrl.pathname === '/api/health') {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/api/public/')) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}