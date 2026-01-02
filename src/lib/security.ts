import { type NextRequest, NextResponse } from "next/server";

// Enhanced in-memory rate limiting with different strategies
const rateLimitMap = new Map<string, { 
  count: number; 
  resetTime: number; 
  attempts: number;
  lastAttempt: number;
  lockoutUntil?: number;
  actionType?: string;
}>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

interface AuthRateLimitOptions extends RateLimitOptions {
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  progressiveLockout?: boolean;
  actionType?: string;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  maxFailedAttempts: number;
  lockoutDuration: number;
  progressiveLockout: boolean;
}

function rateLimit(options: RateLimitOptions) {
  return (req: NextRequest) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : getClientIP(req);
    const now = Date.now();

    // Clean up old entries
    for (const [k, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(k);
      }
    }

    const current = rateLimitMap.get(key);

    if (!current || current.resetTime < now) {
      rateLimitMap.set(key, { 
        count: 1, 
        resetTime: now + options.windowMs, 
        attempts: 1,
        lastAttempt: now
      });
      return null;
    }

    if (current.count >= options.maxRequests) {
      return NextResponse.json(
        { 
          error: "Too many requests", 
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, options.maxRequests - current.count).toString(),
            'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
          }
        }
      );
    }

    current.count++;
    return null;
  };
}

// Enhanced rate limiter for authentication endpoints
export function createAuthRateLimit(options: AuthRateLimitOptions) {
  return (req: NextRequest) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : getClientIP(req);
    const now = Date.now();
    const maxAttempts = options.maxLoginAttempts || 5;
    const lockoutDuration = options.lockoutDuration || 15 * 60 * 1000; // 15 minutes

    // Clean up old entries
    for (const [k, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(k);
      }
    }

    const current = rateLimitMap.get(key);

    // Check if IP is locked out
    if (current && current.attempts >= maxAttempts && current.resetTime > now) {
      return NextResponse.json(
        { 
          error: "Account temporarily locked due to too many failed attempts",
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': maxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
          }
        }
      );
    }

    // Reset attempts if lockout period has passed
    if (current && current.resetTime < now) {
      rateLimitMap.set(key, { 
        count: 1, 
        resetTime: now + options.windowMs, 
        attempts: 1,
        lastAttempt: now
      });
      return null;
    }

    if (!current) {
      rateLimitMap.set(key, { 
        count: 1, 
        resetTime: now + options.windowMs, 
        attempts: 1,
        lastAttempt: now
      });
      return null;
    }

    // Check regular rate limit
    if (current.count >= options.maxRequests) {
      return NextResponse.json(
        { 
          error: "Too many requests", 
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, options.maxRequests - current.count).toString(),
            'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
          }
        }
      );
    }

    current.count++;
    return null;
  };
}

// Track failed login attempts
export function trackFailedLogin(req: NextRequest) {
  const key = getClientIP(req);
  const now = Date.now();
  const lockoutDuration = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const current = rateLimitMap.get(key);
  
  if (!current) {
    rateLimitMap.set(key, { 
      count: 1, 
      resetTime: now + lockoutDuration, 
      attempts: 1,
      lastAttempt: now
    });
    return;
  }

  current.attempts++;
  
  if (current.attempts >= maxAttempts) {
    current.resetTime = now + lockoutDuration;
  }
}

// Reset failed attempts on successful login (legacy function)
export function resetFailedAttemptsLegacy(req: NextRequest) {
  const key = getClientIP(req);
  rateLimitMap.delete(key);
}

// Get client IP address
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return "unknown";
}

export function createRateLimit(options: RateLimitOptions) {
  return rateLimit(options);
}

// Input sanitization utilities
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// CSRF protection
export function generateCSRFToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  return token === sessionToken;
}

// Rate limit configurations for different actions
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'sign-in': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    maxFailedAttempts: 3,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    progressiveLockout: true
  },
  'sign-up': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3,
    maxFailedAttempts: 2,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    progressiveLockout: true
  },
  'forgot-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    maxFailedAttempts: 2,
    lockoutDuration: 60 * 60 * 1000, // 1 hour
    progressiveLockout: true
  },
  'get-session': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 30,
    maxFailedAttempts: 10,
    lockoutDuration: 5 * 60 * 1000, // 5 minutes
    progressiveLockout: false
  },
  'default': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    progressiveLockout: true
  }
};

// Enhanced rate limiter with action-specific configurations
export function createActionRateLimit(actionType: string = 'default') {
  const config = RATE_LIMIT_CONFIGS[actionType] || RATE_LIMIT_CONFIGS.default;
  
  return (req: NextRequest) => {
    const key = `${getClientIP(req)}:${actionType}`;
    const now = Date.now();

    // Clean up expired entries
    cleanupExpiredEntries(now);

    const current = rateLimitMap.get(key);

    // Check if IP is locked out
    if (current && current.lockoutUntil && current.lockoutUntil > now) {
      return createRateLimitResponse(
        'Account temporarily locked due to too many failed attempts',
        Math.ceil((current.lockoutUntil - now) / 1000),
        config.maxRequests,
        0,
        new Date(current.lockoutUntil).toISOString()
      );
    }

    // Reset if lockout period has passed
    if (current && current.lockoutUntil && current.lockoutUntil <= now) {
      rateLimitMap.delete(key);
    }

    if (!current) {
      rateLimitMap.set(key, { 
        count: 1, 
        resetTime: now + config.windowMs, 
        attempts: 1,
        lastAttempt: now,
        actionType
      });
      return null;
    }

    // Check regular rate limit
    if (current.count >= config.maxRequests) {
      return createRateLimitResponse(
        'Too many requests',
        Math.ceil((current.resetTime - now) / 1000),
        config.maxRequests,
        Math.max(0, config.maxRequests - current.count),
        new Date(current.resetTime).toISOString()
      );
    }

    current.count++;
    current.lastAttempt = now;
    return null;
  };
}

// Track failed attempts with progressive lockout
export function trackFailedAttempt(req: NextRequest, actionType: string = 'default') {
  const config = RATE_LIMIT_CONFIGS[actionType] || RATE_LIMIT_CONFIGS.default;
  const key = `${getClientIP(req)}:${actionType}`;
  const now = Date.now();

  const current = rateLimitMap.get(key);
  
  if (!current) {
    rateLimitMap.set(key, { 
      count: 1, 
      resetTime: now + config.windowMs, 
      attempts: 1,
      lastAttempt: now,
      actionType
    });
    return;
  }

  current.attempts++;
  current.lastAttempt = now;
  
  // Progressive lockout: increase lockout duration with each failure
  if (current.attempts >= config.maxFailedAttempts) {
    const lockoutMultiplier = config.progressiveLockout ? Math.min(current.attempts - config.maxFailedAttempts + 1, 5) : 1;
    current.lockoutUntil = now + (config.lockoutDuration * lockoutMultiplier);
  }
}

// Reset failed attempts on successful action
export function resetFailedAttempts(req: NextRequest, actionType: string = 'default') {
  const key = `${getClientIP(req)}:${actionType}`;
  rateLimitMap.delete(key);
}

// Clean up expired entries to prevent memory leaks
function cleanupExpiredEntries(now: number) {
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now && (!value.lockoutUntil || value.lockoutUntil < now)) {
      rateLimitMap.delete(key);
    }
  }
}

// Create standardized rate limit response
function createRateLimitResponse(
  message: string,
  retryAfter: number,
  limit: number,
  remaining: number,
  resetTime: string
) {
  return NextResponse.json(
    { 
      error: message,
      retryAfter,
      limit,
      remaining,
      resetTime
    }, 
    { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime,
        'X-RateLimit-Policy': '1;w=900' // 15 minutes window
      }
    }
  );
}

// Get rate limit status for debugging
export function getRateLimitStatus(ip: string, actionType: string = 'default') {
  const key = `${ip}:${actionType}`;
  const current = rateLimitMap.get(key);
  
  if (!current) {
    return { status: 'clean', attempts: 0, lockoutUntil: null };
  }

  const now = Date.now();
  const isLocked = current.lockoutUntil && current.lockoutUntil > now;
  const isRateLimited = current.count >= (RATE_LIMIT_CONFIGS[actionType] || RATE_LIMIT_CONFIGS.default).maxRequests;

  return {
    status: isLocked ? 'locked' : isRateLimited ? 'rate_limited' : 'active',
    attempts: current.attempts,
    count: current.count,
    lockoutUntil: current.lockoutUntil,
    resetTime: current.resetTime,
    lastAttempt: current.lastAttempt
  };
}

// Security headers for additional protection
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );
  
  return response;
}

// Validate origin for additional security
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Allow requests without origin (e.g., direct API calls)
  if (!origin && !referer) {
    return true;
  }
  
  // Check against allowed origins
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://localhost:3000'
  ].filter(Boolean);
  
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }
  
  if (referer && allowedOrigins.some(allowed => allowed && referer.startsWith(allowed))) {
    return true;
  }
  
  return false;
}

// Log security events
export function logSecurityEvent(
  event: string,
  ip: string,
  userAgent: string,
  details: Record<string, any> = {}
) {
  console.log(`[SECURITY] ${event}`, {
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    ...details
  });
}
