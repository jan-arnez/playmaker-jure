import { NextRequest, NextResponse } from "next/server";
import { BookingAuditor } from "@/lib/booking-audit";
import { createRateLimit } from "@/lib/security";

// Rate limiting for admin endpoints: 10 requests per minute
const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get anomaly data
    const anomalies = await BookingAuditor.detectAnomalies();

    // Filter by severity if specified
    let filteredSuspiciousBookings = anomalies.suspiciousBookings;
    let filteredAbusePatterns = anomalies.abusePatterns;

    if (severity) {
      filteredSuspiciousBookings = anomalies.suspiciousBookings.filter(
        booking => booking.severity === severity
      );
      filteredAbusePatterns = anomalies.abusePatterns.filter(
        pattern => pattern.severity === severity
      );
    }

    // Apply limit
    filteredSuspiciousBookings = filteredSuspiciousBookings.slice(0, limit);
    filteredAbusePatterns = filteredAbusePatterns.slice(0, limit);

    // Calculate anomaly statistics
    const anomalyStats = {
      totalSuspiciousBookings: anomalies.suspiciousBookings.length,
      totalAbusePatterns: anomalies.abusePatterns.length,
      severityDistribution: {
        low: anomalies.suspiciousBookings.filter(b => b.severity === 'low').length +
             anomalies.abusePatterns.filter(p => p.severity === 'low').length,
        medium: anomalies.suspiciousBookings.filter(b => b.severity === 'medium').length +
                anomalies.abusePatterns.filter(p => p.severity === 'medium').length,
        high: anomalies.suspiciousBookings.filter(b => b.severity === 'high').length +
              anomalies.abusePatterns.filter(p => p.severity === 'high').length
      },
      riskScore: calculateRiskScore(anomalies)
    };

    return NextResponse.json({
      success: true,
      data: {
        suspiciousBookings: filteredSuspiciousBookings,
        abusePatterns: filteredAbusePatterns,
        statistics: anomalyStats,
        generatedAt: new Date().toISOString(),
        filters: {
          severity,
          limit
        }
      }
    });

  } catch (error) {
    console.error("Error fetching booking anomalies:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch booking anomalies",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

function calculateRiskScore(anomalies: {
  suspiciousBookings: Array<{ severity: 'low' | 'medium' | 'high' }>;
  abusePatterns: Array<{ severity: 'low' | 'medium' | 'high' }>;
}): number {
  let score = 0;
  
  // Weight suspicious bookings
  anomalies.suspiciousBookings.forEach(booking => {
    switch (booking.severity) {
      case 'low': score += 1; break;
      case 'medium': score += 3; break;
      case 'high': score += 5; break;
    }
  });
  
  // Weight abuse patterns
  anomalies.abusePatterns.forEach(pattern => {
    switch (pattern.severity) {
      case 'low': score += 2; break;
      case 'medium': score += 5; break;
      case 'high': score += 10; break;
    }
  });
  
  // Normalize to 0-100 scale
  const maxPossibleScore = (anomalies.suspiciousBookings.length + anomalies.abusePatterns.length) * 10;
  return maxPossibleScore > 0 ? Math.min(100, (score / maxPossibleScore) * 100) : 0;
}