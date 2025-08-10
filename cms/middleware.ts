/**
 * Security Middleware
 * Applies security measures to all requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { SecurityService } from './lib/security';

// Initialize security service
const securityService = SecurityService.getInstance();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  const securityHeaders = securityService.getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Check if IP is blocked
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   request.ip ||
                   'unknown';

  if (securityService.isIPBlocked(clientIP)) {
    securityService.logSecurityEvent('unauthorized_access', request, {
      reason: 'Blocked IP attempted access'
    });
    
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    // Skip CSRF for API authentication endpoints
    if (request.nextUrl.pathname === '/api/auth/token') {
      return response;
    }

    const csrfToken = request.headers.get('x-csrf-token');
    const sessionId = request.headers.get('x-session-id');

    if (!csrfToken || !sessionId) {
      securityService.logSecurityEvent('csrf_violation', request, {
        reason: 'Missing CSRF token or session ID'
      });
      
      return NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      );
    }

    if (!securityService.verifyCSRFToken(csrfToken, sessionId)) {
      securityService.logSecurityEvent('csrf_violation', request, {
        reason: 'Invalid CSRF token'
      });
      
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  // Log suspicious patterns in URLs
  const url = request.nextUrl.pathname + request.nextUrl.search;
  if (securityService.detectSQLInjection(url) || securityService.detectXSS(url)) {
    securityService.logSecurityEvent('suspicious_activity', request, {
      reason: 'Malicious patterns detected in URL',
      url
    });
  }

  return response;
}

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