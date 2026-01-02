import { NextRequest, NextResponse } from "next/server";
import { BookingAuditor } from "@/lib/booking-audit";
import { createRateLimit } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

// Rate limiting for admin endpoints: 10 requests per minute
const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const patternType = searchParams.get('patternType');

    // Convert date strings to Date objects
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get anomalies from BookingAuditor
    const anomalies = await BookingAuditor.detectAnomalies();

    // Get additional abuse pattern analysis
    const abusePatterns = await analyzeAbusePatterns(start, end, patternType);

    // Merge patterns from both sources
    const allPatterns = [...abusePatterns, ...anomalies.abusePatterns.map(p => ({
      pattern: p.pattern,
      count: p.count,
      severity: p.severity,
      description: p.description || `${p.pattern}: ${p.count} occurrences`,
      recommendations: p.recommendations || [],
      userId: p.userId,
    }))];

    // Calculate pattern statistics
    const patternStats = {
      totalPatterns: allPatterns.length,
      highRiskPatterns: allPatterns.filter(p => p.severity === 'high').length,
      mediumRiskPatterns: allPatterns.filter(p => p.severity === 'medium').length,
      lowRiskPatterns: allPatterns.filter(p => p.severity === 'low').length,
      mostCommonPattern: allPatterns.length > 0 ? 
        allPatterns.reduce((prev, current) => prev.count > current.count ? prev : current).pattern : 
        'None detected',
      riskTrend: calculateRiskTrend(allPatterns)
    };

    return NextResponse.json({
      success: true,
      data: {
        patterns: allPatterns,
        suspiciousBookings: anomalies.suspiciousBookings,
        statistics: patternStats,
        timeRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error fetching abuse patterns:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch abuse patterns",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function analyzeAbusePatterns(
  startDate: Date, 
  endDate: Date, 
  patternType?: string | null
): Promise<Array<{
  pattern: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
  userId?: string;
}>> {
  const patterns: Array<{
    pattern: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendations: string[];
    userId?: string;
  }> = [];

  // 1. RAPID BOOKING PATTERN - More than 5 bookings in time period
  const rapidBookings = await prisma.booking.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { id: true },
    having: {
      id: { _count: { gt: 5 } }
    }
  });

  rapidBookings.forEach(group => {
    const count = group._count.id;
    patterns.push({
      pattern: 'Rapid bookings',
      count,
      severity: count > 10 ? 'high' : count > 7 ? 'medium' : 'low',
      description: `User made ${count} bookings in the specified time period`,
      recommendations: [
        'Consider implementing stricter rate limiting for this user',
        'Review user behavior for potential automation',
        'Send notification to user about booking frequency'
      ],
      userId: group.userId
    });
  });

  // 2. DUPLICATE BOOKING PATTERN
  const duplicateBookings = await prisma.booking.groupBy({
    by: ['facilityId', 'startTime', 'endTime'],
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { id: true },
    having: {
      id: { _count: { gt: 1 } }
    }
  });

  duplicateBookings.forEach(group => {
    const count = group._count.id;
    patterns.push({
      pattern: 'Duplicate bookings',
      count,
      severity: 'high',
      description: `Multiple bookings for the same time slot at facility`,
      recommendations: [
        'Investigate potential system bug allowing duplicate bookings',
        'Review booking validation logic',
        'Check for race conditions in booking creation'
      ]
    });
  });

  // 3. UNUSUAL TIME BOOKINGS - Fetch and filter client-side
  const allBookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    select: {
      id: true,
      startTime: true,
      userId: true
    }
  });

  const unusualTimeBookings = allBookings.filter(b => {
    const hour = b.startTime.getHours();
    return hour < 6 || hour > 22;
  });

  if (unusualTimeBookings.length > 0) {
    patterns.push({
      pattern: 'Bookings at unusual times',
      count: unusualTimeBookings.length,
      severity: unusualTimeBookings.length > 10 ? 'high' : unusualTimeBookings.length > 5 ? 'medium' : 'low',
      description: `${unusualTimeBookings.length} bookings made outside normal hours (before 6 AM or after 10 PM)`,
      recommendations: [
        'Review business hours validation',
        'Consider implementing time-based restrictions',
        'Monitor for automated booking attempts'
      ]
    });
  }

  // 4. HIGH CANCELLATION RATE - Per user cancellation analysis
  const userBookings = await prisma.booking.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { id: true }
  });

  const userCancellations = await prisma.booking.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: 'cancelled'
    },
    _count: { id: true }
  });

  const cancMap = new Map(userCancellations.map(u => [u.userId, u._count.id]));
  
  userBookings.forEach(user => {
    const cancelled = cancMap.get(user.userId) || 0;
    const total = user._count.id;
    const rate = total > 0 ? cancelled / total : 0;
    
    if (rate > 0.5 && total >= 3) {
      patterns.push({
        pattern: 'High cancellation rate',
        count: cancelled,
        severity: rate > 0.7 ? 'high' : 'medium',
        description: `User cancelled ${cancelled}/${total} bookings (${(rate * 100).toFixed(0)}% cancellation rate)`,
        recommendations: [
          'Consider requiring prepayment for this user',
          'Review cancellation policies',
          'This may indicate slot hoarding behavior'
        ],
        userId: user.userId
      });
    }
  });

  // 5. USERS WITH STRIKES MAKING BOOKINGS
  const strikeUsers = await prisma.user.findMany({
    where: {
      activeStrikes: { gte: 2 },
      bookings: {
        some: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }
    },
    select: {
      id: true,
      activeStrikes: true,
      _count: {
        select: { bookings: true }
      }
    }
  });

  strikeUsers.forEach(user => {
    patterns.push({
      pattern: 'High-strike user active',
      count: user._count.bookings,
      severity: user.activeStrikes >= 3 ? 'high' : 'medium',
      description: `User with ${user.activeStrikes} active strikes made bookings`,
      recommendations: [
        'Consider additional verification requirements',
        'Review no-show history',
        'Apply stricter booking limits'
      ],
      userId: user.id
    });
  });

  // Filter by pattern type if specified
  if (patternType) {
    return patterns.filter(p => p.pattern.toLowerCase().includes(patternType.toLowerCase()));
  }

  return patterns;
}

function calculateRiskTrend(patterns: Array<{ severity: 'low' | 'medium' | 'high' }>): 'increasing' | 'decreasing' | 'stable' {
  const highRiskCount = patterns.filter(p => p.severity === 'high').length;
  const mediumRiskCount = patterns.filter(p => p.severity === 'medium').length;
  
  if (highRiskCount > mediumRiskCount) {
    return 'increasing';
  } else if (highRiskCount < mediumRiskCount) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}