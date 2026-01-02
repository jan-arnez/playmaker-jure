import { NextRequest } from "next/server";

// Test utility for rate limiter
export async function testRateLimiter() {
  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing Rate Limiter...\n');
  
  // Test 1: Normal requests should work
  console.log('Test 1: Normal requests (should succeed)');
  for (let i = 1; i <= 3; i++) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`  Request ${i}: Status ${response.status}`);
      
      if (response.headers.get('X-RateLimit-Limit')) {
        console.log(`  Rate limit headers:`, {
          limit: response.headers.get('X-RateLimit-Limit'),
          remaining: response.headers.get('X-RateLimit-Remaining'),
          reset: response.headers.get('X-RateLimit-Reset'),
        });
      }
    } catch (error) {
      console.log(`  Request ${i}: Error - ${error}`);
    }
  }
  
  console.log('\n');
  
  // Test 2: Rapid login attempts (should trigger rate limiting)
  console.log('Test 2: Rapid login attempts (should trigger rate limiting)');
  for (let i = 1; i <= 8; i++) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/sign-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sign-in',
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });
      
      console.log(`  Login attempt ${i}: Status ${response.status}`);
      
      if (response.status === 429) {
        const errorData = await response.json();
        console.log(`  Rate limited: ${errorData.error}`);
        console.log(`  Retry after: ${response.headers.get('Retry-After')} seconds`);
        break;
      }
      
      if (response.headers.get('X-RateLimit-Limit')) {
        console.log(`  Rate limit headers:`, {
          limit: response.headers.get('X-RateLimit-Limit'),
          remaining: response.headers.get('X-RateLimit-Remaining'),
          reset: response.headers.get('X-RateLimit-Reset'),
        });
      }
    } catch (error) {
      console.log(`  Login attempt ${i}: Error - ${error}`);
    }
  }
  
  console.log('\n');
  
  // Test 3: Different actions should have different limits
  console.log('Test 3: Testing different action limits');
  const actions = ['sign-in', 'sign-up', 'forgot-password', 'get-session'];
  
  for (const action of actions) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          email: 'test@example.com',
        }),
      });
      
      console.log(`  ${action}: Status ${response.status}`);
      
      if (response.headers.get('X-RateLimit-Limit')) {
        console.log(`  Rate limit for ${action}:`, {
          limit: response.headers.get('X-RateLimit-Limit'),
          window: response.headers.get('X-RateLimit-Window'),
        });
      }
    } catch (error) {
      console.log(`  ${action}: Error - ${error}`);
    }
  }
  
  console.log('\n✅ Rate limiter test completed');
}

// Manual test function that can be called from browser console
export function runRateLimiterTest() {
  if (typeof window !== 'undefined') {
    console.log('Rate limiter test can only be run on the server side');
    return;
  }
  
  testRateLimiter().catch(console.error);
}

// Create a mock request for testing
export function createMockRequest(
  url: string, 
  method: string = 'POST', 
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const mockHeaders = new Headers({
    'content-type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
    ...headers,
  });
  
  return new NextRequest(url, {
    method,
    headers: mockHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}
