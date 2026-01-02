import { type NextRequest, NextResponse } from "next/server";
import { 
  addSecurityHeaders, 
  validateOrigin, 
  logSecurityEvent, 
  getClientIP,
  sanitizeInput
} from "./security";

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableFrameOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  trustedIPs: string[];
  allowedOrigins: string[];
  enableOriginValidation: boolean;
  enableSecurityLogging: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableXSSProtection: true,
  enableFrameOptions: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true,
  trustedIPs: [
    '127.0.0.1',
    '::1',
    'localhost'
  ],
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  enableOriginValidation: true,
  enableSecurityLogging: true
};

/**
 * Security middleware for authentication endpoints
 */
export class AuthSecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Apply security middleware to request
   */
  async applySecurity(req: NextRequest): Promise<NextResponse | null> {
    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    // Log security event
    if (this.config.enableSecurityLogging) {
      logSecurityEvent('request_received', ip, userAgent, {
        method: req.method,
        url: req.url,
        origin,
        referer
      });
    }

    // Validate origin
    if (this.config.enableOriginValidation && !this.isTrustedIP(ip)) {
      if (!validateOrigin(req)) {
        logSecurityEvent('origin_validation_failed', ip, userAgent, {
          origin,
          referer,
          allowedOrigins: this.config.allowedOrigins
        });

        return NextResponse.json(
          { error: 'Invalid origin' },
          { 
            status: 403,
            headers: {
              'X-Security-Reason': 'origin-validation-failed'
            }
          }
        );
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousActivity(req);
    if (suspiciousPatterns.length > 0) {
      logSecurityEvent('suspicious_activity_detected', ip, userAgent, {
        patterns: suspiciousPatterns,
        url: req.url
      });

      return NextResponse.json(
        { error: 'Suspicious activity detected' },
        { 
          status: 403,
          headers: {
            'X-Security-Reason': 'suspicious-activity'
          }
        }
      );
    }

    return null; // No security issues
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
    // HSTS (HTTP Strict Transport Security)
    if (this.config.enableHSTS) {
  response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Content Security Policy
    if (this.config.enableCSP) {
      const csp = this.buildCSP();
      response.headers.set('Content-Security-Policy', csp);
    }

    // Permissions Policy
    if (this.config.enablePermissionsPolicy) {
      const permissions = this.buildPermissionsPolicy();
      response.headers.set('Permissions-Policy', permissions);
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  return response;
}

  /**
   * Check if IP is trusted
   */
  private isTrustedIP(ip: string): boolean {
    return this.config.trustedIPs.includes(ip);
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(req: NextRequest): string[] {
    const suspiciousPatterns: string[] = [];
    const userAgent = req.headers.get('user-agent') || '';
    const url = req.url;

    // Check for common attack patterns
    const attackPatterns = [
      /\.\.\//, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript injection
      /on\w+\s*=/i, // Event handler injection
      /eval\s*\(/i, // Code injection
      /document\.cookie/i, // Cookie manipulation
      /window\.location/i, // Location manipulation
    ];

    for (const pattern of attackPatterns) {
      if (pattern.test(url) || pattern.test(userAgent)) {
        suspiciousPatterns.push(pattern.source);
      }
    }

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'masscan',
      'zap',
      'burp',
      'w3af',
      'acunetix',
      'nessus',
      'openvas'
    ];

    for (const suspiciousUA of suspiciousUserAgents) {
      if (userAgent.toLowerCase().includes(suspiciousUA)) {
        suspiciousPatterns.push(`suspicious-user-agent:${suspiciousUA}`);
      }
    }

    // Check for rapid requests (basic detection)
    const rapidRequestPattern = /rapid/i;
    if (rapidRequestPattern.test(userAgent)) {
      suspiciousPatterns.push('rapid-request-detected');
    }

    return suspiciousPatterns;
  }

  /**
   * Build Content Security Policy
   */
  private buildCSP(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self'",
      "child-src 'self'",
      "frame-src 'none'"
    ];

    return directives.join('; ');
  }

  /**
   * Build Permissions Policy
   */
  private buildPermissionsPolicy(): string {
    const permissions = [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()',
      'vibrate=()',
      'fullscreen=(self)',
      'payment=()'
    ];

    return permissions.join(', ');
  }

  /**
   * Sanitize request data
   */
  sanitizeRequestData(data: any): any {
    if (typeof data === 'string') {
      return sanitizeInput(data);
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeInput(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeRequestData(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Create security event log
   */
  logSecurityEvent(
    event: string,
    req: NextRequest,
    details: Record<string, any> = {}
  ): void {
    if (!this.config.enableSecurityLogging) return;

    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    logSecurityEvent(event, ip, userAgent, {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

/**
 * Create security middleware instance
 */
export function createSecurityMiddleware(config?: Partial<SecurityConfig>) {
  return new AuthSecurityMiddleware(config);
}

/**
 * Apply security middleware to handler
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<SecurityConfig>
) {
  const security = createSecurityMiddleware(config);

  return async (req: NextRequest): Promise<NextResponse> => {
    // Apply security checks
    const securityResponse = await security.applySecurity(req);
    if (securityResponse) {
      return securityResponse;
    }

    // Call original handler
    const response = await handler(req);

    // Apply security headers
    return security.applySecurityHeaders(response);
  };
}

/**
 * Security utilities
 */
export class SecurityUtils {
  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Hash sensitive data for logging
   */
  static hashSensitiveData(data: string): string {
    // Simple hash for logging purposes
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Validate request size
   */
  static validateRequestSize(req: NextRequest, maxSize: number = 1024 * 1024): boolean {
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength) <= maxSize;
    }
    return true; // Allow if no content-length header
  }

  /**
   * Check for common attack vectors
   */
  static detectAttackVectors(req: NextRequest): string[] {
    const attackVectors: string[] = [];
    const url = req.url;
    const userAgent = req.headers.get('user-agent') || '';

    // SQL injection patterns
    const sqlPatterns = [
      /union.*select/i,
      /drop.*table/i,
      /insert.*into/i,
      /delete.*from/i,
      /update.*set/i,
      /or.*1=1/i,
      /and.*1=1/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(url) || pattern.test(userAgent)) {
        attackVectors.push('sql-injection');
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(url) || pattern.test(userAgent)) {
        attackVectors.push('xss');
      }
    }

    return attackVectors;
  }
}