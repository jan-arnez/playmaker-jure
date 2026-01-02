import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/modules/auth/lib/auth";
import { 
  AuthRateLimiter, 
  withRateLimit, 
  createRateLimitedAuthEndpoint 
} from "@/lib/auth-rate-limiter";
import { 
  withSecurity, 
  createSecurityMiddleware,
  SecurityUtils 
} from "@/lib/auth-middleware";
import { NextRequest, NextResponse } from "next/server";

// Get the original handlers
const { POST: originalPOST, GET: originalGET } = toNextJsHandler(auth);

// Create rate-limited and secured handlers
const rateLimitedPOST = createRateLimitedAuthEndpoint(originalPOST as any);
const rateLimitedGET = createRateLimitedAuthEndpoint(originalGET as any);

// Rate-limited and secured POST handler
export async function POST(request: NextRequest) {
  try {
    // Validate request size
    if (!SecurityUtils.validateRequestSize(request)) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    // Detect attack vectors
    const attackVectors = SecurityUtils.detectAttackVectors(request);
    if (attackVectors.length > 0) {
      return NextResponse.json(
        { error: 'Suspicious activity detected' },
        { status: 403 }
      );
    }

    // Get the request body to determine the action
    const body = await request.clone().json().catch(() => ({}));
    const action = body.action || request.nextUrl.searchParams.get('action') || 'default';

    // Check rate limit
    const rateLimitResult = await AuthRateLimiter.checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Call the original handler
    const response = await originalPOST(request);

    // Track authentication result
    const success = response.status < 400;
    if (success) {
      AuthRateLimiter.trackSuccess(request, action);
    } else {
      AuthRateLimiter.trackFailure(request, action);
    }

    // Add rate limit headers
    if (rateLimitResult.remaining !== undefined) {
      AuthRateLimiter.addRateLimitHeaders(
        response as any,
        rateLimitResult.remaining,
        rateLimitResult.resetTime
      );
    }

    // Apply security headers
    const security = createSecurityMiddleware();
    return security.applySecurityHeaders(response as any);

  } catch (error) {
    console.error('Auth API error:', error);
    
    // Track failed attempts on errors
    const body = await request.clone().json().catch(() => ({}));
    const action = body.action || 'default';
    AuthRateLimiter.trackFailure(request, action, error instanceof Error ? error.message : 'unknown_error');
    
    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { status: 503 }
    );
  }
}

// Rate-limited and secured GET handler
export async function GET(request: NextRequest) {
  try {
    // Validate request size
    if (!SecurityUtils.validateRequestSize(request)) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    // Detect attack vectors
    const attackVectors = SecurityUtils.detectAttackVectors(request);
    if (attackVectors.length > 0) {
      return NextResponse.json(
        { error: 'Suspicious activity detected' },
        { status: 403 }
      );
    }

    // Get action from URL
    const action = request.nextUrl.searchParams.get('action') || 'get-session';

    // Check rate limit
    const rateLimitResult = await AuthRateLimiter.checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Call the original handler
    const response = await originalGET(request);

    // Track authentication result
    const success = response.status < 400;
    if (success) {
      AuthRateLimiter.trackSuccess(request, action);
    } else {
      AuthRateLimiter.trackFailure(request, action);
    }

    // Add rate limit headers
    if (rateLimitResult.remaining !== undefined) {
      AuthRateLimiter.addRateLimitHeaders(
        response as any,
        rateLimitResult.remaining,
        rateLimitResult.resetTime
      );
    }

    // Apply security headers
    const security = createSecurityMiddleware();
    return security.applySecurityHeaders(response as any);

  } catch (error) {
    console.error('Auth API error:', error);
    
    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { status: 503 }
    );
  }
}