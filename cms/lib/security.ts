/**
 * Security Hardening System
 * Comprehensive security measures including input validation, CSRF protection, and security monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';

// Security configuration
interface SecurityConfig {
  csrfSecret: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
  passwordMinLength: number;
  sessionTimeout: number;
  enableSecurityHeaders: boolean;
  enableAuditLogging: boolean;
}

// Security event types
export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'password_change'
  | 'file_upload'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'csrf_violation'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'unauthorized_access';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  blocked: boolean;
}

export interface SecurityAuditLog {
  id: string;
  event: SecurityEvent;
  action: string;
  resource: string;
  success: boolean;
  errorMessage?: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousIPs = new Map<string, { count: number; lastSeen: Date }>();

  private constructor(config: SecurityConfig) {
    this.config = config;
    
    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  static getInstance(config?: SecurityConfig): SecurityService {
    if (!SecurityService.instance) {
      const defaultConfig: SecurityConfig = {
        csrfSecret: process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex'),
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'text/plain', 'text/csv'
        ],
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 100, // requests per window
        passwordMinLength: 8,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        enableSecurityHeaders: true,
        enableAuditLogging: true
      };
      SecurityService.instance = new SecurityService(config || defaultConfig);
    }
    return SecurityService.instance;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const data = `${sessionId}:${timestamp}`;
    const hash = crypto
      .createHmac('sha256', this.config.csrfSecret)
      .update(data)
      .digest('hex');
    
    return `${timestamp}.${hash}`;
  }

  /**
   * Verify CSRF token
   */
  verifyCSRFToken(token: string, sessionId: string): boolean {
    try {
      const [timestamp, hash] = token.split('.');
      if (!timestamp || !hash) return false;

      // Check if token is not too old (1 hour)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 60 * 60 * 1000) return false;

      const data = `${sessionId}:${timestamp}`;
      const expectedHash = crypto
        .createHmac('sha256', this.config.csrfSecret)
        .update(data)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate and sanitize input data
   */
  validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
  } {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  sanitizeHTML(html: string): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }

  /**
   * Detect potential SQL injection attempts
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
      /(\'\s*(OR|AND)\s*\'\w*\'\s*=\s*\'\w*)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Detect potential XSS attempts
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate file upload security
   */
  validateFileUpload(file: {
    name: string;
    size: number;
    type: string;
    buffer?: Buffer;
  }): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }

    // Check file type
    if (!this.config.allowedFileTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'csv'];
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} is not allowed`);
    }

    // Check for malicious file names
    if (this.containsMaliciousPatterns(file.name)) {
      errors.push('File name contains potentially malicious patterns');
    }

    // Basic file content validation
    if (file.buffer) {
      if (this.detectMaliciousContent(file.buffer)) {
        errors.push('File content appears to be malicious');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    type: SecurityEventType,
    request: NextRequest,
    details: Record<string, any> = {},
    userId?: string
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      userId,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      details,
      severity: this.calculateSeverity(type, details),
      timestamp: new Date(),
      blocked: false
    };

    // Check if this IP should be blocked
    if (this.shouldBlockIP(event.ipAddress, type)) {
      event.blocked = true;
      this.blockedIPs.add(event.ipAddress);
    }

    this.securityEvents.push(event);

    // Store in database if audit logging is enabled
    if (this.config.enableAuditLogging) {
      this.storeSecurityEvent(event);
    }

    return event;
  }

  /**
   * Check if IP address is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Get security headers for responses
   */
  getSecurityHeaders(): Record<string, string> {
    if (!this.config.enableSecurityHeaders) return {};

    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'"
      ].join('; '),
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()'
      ].join(', ')
    };
  }

  /**
   * Create security middleware
   */
  createSecurityMiddleware() {
    return {
      // CSRF protection middleware
      csrfProtection: (request: NextRequest) => {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
          const csrfToken = request.headers.get('x-csrf-token');
          const sessionId = request.headers.get('x-session-id');

          if (!csrfToken || !sessionId || !this.verifyCSRFToken(csrfToken, sessionId)) {
            this.logSecurityEvent('csrf_violation', request);
            return NextResponse.json(
              { error: 'CSRF token validation failed' },
              { status: 403 }
            );
          }
        }
        return null;
      },

      // Rate limiting middleware
      rateLimiting: (request: NextRequest) => {
        const ip = this.getClientIP(request);
        
        if (this.isIPBlocked(ip)) {
          return NextResponse.json(
            { error: 'IP address is blocked' },
            { status: 429 }
          );
        }

        // Simple rate limiting implementation
        const key = `rate_limit:${ip}`;
        // In production, use Redis for distributed rate limiting
        
        return null;
      },

      // Input validation middleware
      inputValidation: (request: NextRequest) => {
        const contentType = request.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          // JSON input validation would be handled per endpoint
        }

        return null;
      },

      // Security headers middleware
      securityHeaders: (response: NextResponse) => {
        const headers = this.getSecurityHeaders();
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
    };
  }

  /**
   * Get recent security events
   */
  getRecentSecurityEvents(
    limit: number = 100,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): SecurityEvent[] {
    let events = this.securityEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    if (severity) {
      events = events.filter(event => event.severity === severity);
    }

    return events;
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    eventsByType: Record<string, number>;
    blockedIPs: number;
    suspiciousIPs: number;
    recentEvents: number;
  } {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > last24Hours
    );

    const eventsBySeverity = this.securityEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByType = this.securityEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: this.securityEvents.length,
      eventsBySeverity,
      eventsByType,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      recentEvents: recentEvents.length
    };
  }

  /**
   * Password strength validation
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.config.passwordMinLength) {
      feedback.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
    } else {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      feedback.push('Password should contain lowercase letters');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password should contain uppercase letters');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password should contain numbers');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password should contain special characters');
    } else {
      score += 1;
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      feedback.push('Password is too common');
      score = Math.max(0, score - 2);
    }

    return {
      valid: score >= 3 && feedback.length === 0,
      score,
      feedback
    };
  }

  /**
   * Private helper methods
   */
  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown';
  }

  private calculateSeverity(
    type: SecurityEventType,
    details: Record<string, any>
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<SecurityEventType, 'low' | 'medium' | 'high' | 'critical'> = {
      login_attempt: 'low',
      login_success: 'low',
      login_failure: 'medium',
      password_change: 'medium',
      file_upload: 'low',
      suspicious_activity: 'high',
      rate_limit_exceeded: 'medium',
      csrf_violation: 'high',
      xss_attempt: 'high',
      sql_injection_attempt: 'critical',
      unauthorized_access: 'critical'
    };

    return severityMap[type] || 'medium';
  }

  private shouldBlockIP(ipAddress: string, eventType: SecurityEventType): boolean {
    const suspicious = this.suspiciousIPs.get(ipAddress) || { count: 0, lastSeen: new Date() };
    
    // Increment suspicious activity count
    suspicious.count += 1;
    suspicious.lastSeen = new Date();
    this.suspiciousIPs.set(ipAddress, suspicious);

    // Block IP if too many suspicious events
    const criticalEvents = ['sql_injection_attempt', 'xss_attempt', 'unauthorized_access'];
    if (criticalEvents.includes(eventType) && suspicious.count >= 3) {
      return true;
    }

    if (suspicious.count >= 10) {
      return true;
    }

    return false;
  }

  private containsMaliciousPatterns(filename: string): boolean {
    const maliciousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
      /\.(exe|bat|cmd|scr|pif|com)$/i  // Executable extensions
    ];

    return maliciousPatterns.some(pattern => pattern.test(filename));
  }

  private detectMaliciousContent(buffer: Buffer): boolean {
    const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
    
    // Check for script tags or other malicious content
    return this.detectXSS(content) || this.detectSQLInjection(content);
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  private cleanupOldEvents(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > cutoff
    );

    // Clean up suspicious IPs
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (data.lastSeen.getTime() < cutoff) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }

  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    // In production, store in database
    console.log('Security Event:', {
      type: event.type,
      severity: event.severity,
      ip: event.ipAddress,
      blocked: event.blocked
    });
  }
}