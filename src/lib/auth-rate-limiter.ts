import { type NextRequest, NextResponse } from "next/server";
import { 
  createActionRateLimit, 
  trackFailedAttempt, 
  resetFailedAttempts, 
  getRateLimitStatus,
  logSecurityEvent,
  getClientIP
} from "./security";

export interface AuthAction {
  action: string;
  email?: string;
  password?: string;
  [key: string]: any;
}

export interface RateLimitResult {
  allowed: boolean;
  response?: NextResponse;
  actionType?: string;
  remaining?: number;
  resetTime?: string;
}

/**
 * Action-based rate limiter for authentication endpoints
 */
export class AuthRateLimiter {
  private static actionMap: Record<string, string> = {
    'sign-in': 'sign-in',
    'sign-up': 'sign-up',
    'sign-out': 'get-session',
    'forgot-password': 'forgot-password',
    'reset-password': 'forgot-password',
    'get-session': 'get-session',
    'update-session': 'get-session',
    'delete-session': 'get-session'
  };

  /**
   * Detect action type from request
   */
  static detectAction(req: NextRequest): string {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Extract action from URL path
    if (pathname.includes('/sign-in')) return 'sign-in';
    if (pathname.includes('/sign-up')) return 'sign-up';
    if (pathname.includes('/sign-out')) return 'sign-out';
    if (pathname.includes('/forgot-password')) return 'forgot-password';
    if (pathname.includes('/reset-password')) return 'reset-password';
    if (pathname.includes('/session')) return 'get-session';
    
    // Try to extract from request body
    try {
      const body = req.clone().json();
      if (body && typeof body === 'object' && 'action' in body) {
        return this.actionMap[body.action as string] || 'default';
      }
    } catch (error) {
      // Ignore JSON parsing errors
    }
    
    return 'default';
  }

  /**
   * Check rate limit for authentication action
   */
  static async checkRateLimit(req: NextRequest): Promise<RateLimitResult> {
    const actionType = this.detectAction(req);
    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Log the attempt
    logSecurityEvent('auth_attempt', ip, userAgent, { actionType });

    // Apply rate limiting
    const rateLimit = createActionRateLimit(actionType);
    const rateLimitResponse = rateLimit(req);

    if (rateLimitResponse) {
      logSecurityEvent('rate_limit_exceeded', ip, userAgent, { actionType });
      return {
        allowed: false,
        response: rateLimitResponse,
        actionType
      };
    }

    // Get current status for response headers
    const status = getRateLimitStatus(ip, actionType);
    
    return {
      allowed: true,
      actionType,
      remaining: status.count ? Math.max(0, 5 - status.count) : 5,
      resetTime: status.resetTime ? new Date(status.resetTime).toISOString() : undefined
    };
  }

  /**
   * Track successful authentication
   */
  static trackSuccess(req: NextRequest, actionType?: string): void {
    const detectedAction = actionType || this.detectAction(req);
    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Reset failed attempts on success
    resetFailedAttempts(req, detectedAction);
    
    logSecurityEvent('auth_success', ip, userAgent, { actionType: detectedAction });
  }

  /**
   * Track failed authentication attempt
   */
  static trackFailure(req: NextRequest, actionType?: string, error?: string): void {
    const detectedAction = actionType || this.detectAction(req);
    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Track failed attempt
    trackFailedAttempt(req, detectedAction);
    
    logSecurityEvent('auth_failure', ip, userAgent, { 
      actionType: detectedAction, 
      error: error || 'unknown_error' 
    });
  }

  /**
   * Create rate-limited response with proper headers
   */
  static createRateLimitedResponse(
    message: string,
    retryAfter: number,
    actionType: string
  ): NextResponse {
    const response = NextResponse.json(
      { 
        error: message,
        retryAfter,
        actionType
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('Retry-After', retryAfter.toString());
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + retryAfter * 1000).toISOString());
    response.headers.set('X-RateLimit-Policy', '1;w=900');

    return response;
  }

  /**
   * Add rate limit headers to successful responses
   */
  static addRateLimitHeaders(
    response: NextResponse,
    remaining: number,
    resetTime?: string
  ): NextResponse {
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    if (resetTime) {
      response.headers.set('X-RateLimit-Reset', resetTime);
    }

    return response;
  }

  /**
   * Get rate limit status for debugging
   */
  static getStatus(ip: string, actionType?: string) {
    return getRateLimitStatus(ip, actionType || 'default');
  }

  /**
   * Clear rate limit for specific IP and action
   */
  static clearRateLimit(ip: string, actionType: string = 'default'): void {
    const key = `${ip}:${actionType}`;
    // This would need access to the internal rateLimitMap
    // For now, we'll log the action
    logSecurityEvent('rate_limit_cleared', ip, 'system', { actionType });
  }
}

/**
 * Middleware wrapper for BetterAuth handlers
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Check rate limit
      const rateLimitResult = await AuthRateLimiter.checkRateLimit(req);
      
      if (!rateLimitResult.allowed) {
        return rateLimitResult.response!;
      }

      // Call the original handler
      const response = await handler(req);

      // Add rate limit headers to successful responses
      if (response.status < 400 && rateLimitResult.remaining !== undefined) {
        AuthRateLimiter.addRateLimitHeaders(
          response,
          rateLimitResult.remaining,
          rateLimitResult.resetTime
        );
      }

      // Track the result
      if (response.status >= 400) {
        AuthRateLimiter.trackFailure(req, rateLimitResult.actionType);
      } else {
        AuthRateLimiter.trackSuccess(req, rateLimitResult.actionType);
      }

      return response;
    } catch (error) {
      // Track errors as failures
      AuthRateLimiter.trackFailure(req, undefined, error instanceof Error ? error.message : 'unknown_error');
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Utility function to create rate-limited auth endpoints
 */
export function createRateLimitedAuthEndpoint(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler);
}

/**
 * Rate limit configuration for different environments
 */
export const RATE_LIMIT_ENVIRONMENTS = {
  development: {
    signIn: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
    signUp: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
    forgotPassword: { maxRequests: 5, windowMs: 60 * 60 * 1000 }
  },
  production: {
    signIn: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
    signUp: { maxRequests: 3, windowMs: 15 * 60 * 1000 },
    forgotPassword: { maxRequests: 3, windowMs: 60 * 60 * 1000 }
  },
  testing: {
    signIn: { maxRequests: 100, windowMs: 60 * 1000 },
    signUp: { maxRequests: 100, windowMs: 60 * 1000 },
    forgotPassword: { maxRequests: 100, windowMs: 60 * 1000 }
  }
};

/**
 * Get rate limit configuration based on environment
 */
export function getRateLimitConfig(environment: keyof typeof RATE_LIMIT_ENVIRONMENTS = 'production') {
  return RATE_LIMIT_ENVIRONMENTS[environment];
}