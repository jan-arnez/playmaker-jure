import { prisma } from "@/lib/prisma";

export interface BookingAuditEvent {
  id: string;
  bookingId: string;
  action: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'completed' | 'deleted';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface BookingMetrics {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  averageBookingDuration: number;
  peakBookingHours: number[];
  mostPopularFacilities: Array<{ facilityId: string; count: number }>;
  abuseAttempts: number;
  conflictResolutions: number;
}

export class BookingAuditor {
  /**
   * Log a booking audit event to the AdminAuditLog table
   */
  static async logEvent(event: Omit<BookingAuditEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Store in AdminAuditLog table
      if (event.userId) {
        await prisma.adminAuditLog.create({
          data: {
            adminId: event.userId,
            action: `booking.${event.action}`,
            entityType: 'booking',
            entityId: event.bookingId,
            details: {
              ...event.details,
              severity: event.severity,
            },
            ipAddress: event.ipAddress || null,
            userAgent: event.userAgent || null,
          },
        });
      }
      
      console.log('Booking Audit Event:', {
        ...event,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  static async getMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<BookingMetrics> {
    const whereClause = {
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      })
    };

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      bookingsWithDuration
    ] = await Promise.all([
      prisma.booking.count({ where: whereClause }),
      prisma.booking.count({ where: { ...whereClause, status: 'pending' } }),
      prisma.booking.count({ where: { ...whereClause, status: 'confirmed' } }),
      prisma.booking.count({ where: { ...whereClause, status: 'cancelled' } }),
      prisma.booking.count({ where: { ...whereClause, status: 'completed' } }),
      prisma.booking.findMany({
        where: whereClause,
        select: {
          startTime: true,
          endTime: true,
          facilityId: true
        }
      })
    ]);

    // Calculate average duration
    const durations = bookingsWithDuration.map(booking => 
      booking.endTime.getTime() - booking.startTime.getTime()
    );
    const averageBookingDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;

    // Calculate peak hours
    const hourCounts = new Map<number, number>();
    bookingsWithDuration.forEach(booking => {
      const hour = booking.startTime.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    const peakBookingHours = Array.from(hourCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

    // Most popular facilities
    const facilityCounts = new Map<string, number>();
    bookingsWithDuration.forEach(booking => {
      const count = facilityCounts.get(booking.facilityId) || 0;
      facilityCounts.set(booking.facilityId, count + 1);
    });
    const mostPopularFacilities = Array.from(facilityCounts.entries())
      .map(([facilityId, count]) => ({ facilityId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      averageBookingDuration,
      peakBookingHours,
      mostPopularFacilities,
      abuseAttempts: 0,
      conflictResolutions: 0
    };
  }

  static async detectAnomalies(): Promise<{
    suspiciousBookings: Array<{
      bookingId: string;
      reason: string;
      severity: 'low' | 'medium' | 'high';
      userId?: string;
    }>;
    abusePatterns: Array<{
      pattern: string;
      count: number;
      severity: 'low' | 'medium' | 'high';
      userId?: string;
      description?: string;
      recommendations?: string[];
    }>;
  }> {
    const suspiciousBookings: Array<{
      bookingId: string;
      reason: string;
      severity: 'low' | 'medium' | 'high';
      userId?: string;
    }> = [];

    const abusePatterns: Array<{
      pattern: string;
      count: number;
      severity: 'low' | 'medium' | 'high';
      userId?: string;
      description?: string;
      recommendations?: string[];
    }> = [];

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. RAPID BOOKINGS - Check for rapid bookings from same user (last hour)
    const rapidBookings = await prisma.booking.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: oneHourAgo }
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 3 } }
      }
    });

    rapidBookings.forEach(group => {
      abusePatterns.push({
        pattern: 'Rapid bookings',
        count: group._count.id,
        severity: group._count.id > 5 ? 'high' : 'medium',
        userId: group.userId,
        description: `User made ${group._count.id} bookings in the last hour`,
        recommendations: [
          'Consider implementing stricter rate limiting for this user',
          'Review user behavior for potential automation'
        ]
      });
    });

    // 2. UNUSUAL TIMES - Check for bookings at unusual hours (fetch and filter client-side)
    const recentBookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: oneDayAgo }
      },
      select: {
        id: true,
        startTime: true,
        userId: true
      }
    });

    recentBookings.forEach(booking => {
      const hour = booking.startTime.getHours();
      if (hour < 6 || hour > 22) {
        suspiciousBookings.push({
          bookingId: booking.id,
          reason: `Booking at unusual time: ${hour}:00`,
          severity: 'medium',
          userId: booking.userId
        });
      }
    });

    // 3. DUPLICATE BOOKINGS - Check for duplicate bookings at same slot
    const duplicateBookings = await prisma.booking.groupBy({
      by: ['facilityId', 'startTime', 'endTime'],
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } }
      }
    });

    duplicateBookings.forEach(group => {
      abusePatterns.push({
        pattern: 'Duplicate bookings',
        count: group._count.id,
        severity: 'high',
        description: `Multiple bookings for same time slot at facility`,
        recommendations: [
          'Investigate potential system bug',
          'Check for race conditions in booking creation'
        ]
      });
    });

    // 4. HIGH CANCELLATION RATE - Users who cancel more than 50% of their bookings
    const userBookingStats = await prisma.booking.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true }
    });

    const userCancellations = await prisma.booking.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: 'cancelled'
      },
      _count: { id: true }
    });

    const cancellationMap = new Map(userCancellations.map(u => [u.userId, u._count.id]));
    
    userBookingStats.forEach(user => {
      const cancelled = cancellationMap.get(user.userId) || 0;
      const total = user._count.id;
      const rate = total > 0 ? cancelled / total : 0;
      
      if (rate > 0.5 && total >= 3) {
        abusePatterns.push({
          pattern: 'High cancellation rate',
          count: cancelled,
          severity: rate > 0.7 ? 'high' : 'medium',
          userId: user.userId,
          description: `User cancelled ${cancelled}/${total} bookings (${(rate * 100).toFixed(0)}%)`,
          recommendations: [
            'Consider requiring prepayment for this user',
            'Review cancellation policies',
            'Potential slot hoarding behavior'
          ]
        });
      }
    });

    // 5. BOOKING-THEN-CANCEL HOARDING - Users who book and cancel within 24h frequently
    const recentCancellations = await prisma.booking.findMany({
      where: {
        status: 'cancelled',
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const hoarding = new Map<string, number>();
    recentCancellations.forEach(booking => {
      const timeDiff = booking.updatedAt.getTime() - booking.createdAt.getTime();
      const hoursToCancel = timeDiff / (60 * 60 * 1000);
      
      if (hoursToCancel < 24) {
        const count = hoarding.get(booking.userId) || 0;
        hoarding.set(booking.userId, count + 1);
      }
    });

    hoarding.forEach((count, userId) => {
      if (count >= 3) {
        abusePatterns.push({
          pattern: 'Booking hoarding suspected',
          count,
          severity: count > 5 ? 'high' : 'medium',
          userId,
          description: `User booked and cancelled ${count} times within 24h`,
          recommendations: [
            'Potential slot hoarding to prevent others from booking',
            'Consider implementing booking hold fees',
            'Review user account for abuse'
          ]
        });
      }
    });

    // 6. USERS WITH STRIKES STILL BOOKING - Check if users with active strikes are booking
    const usersWithStrikes = await prisma.user.findMany({
      where: {
        activeStrikes: { gte: 2 }
      },
      select: {
        id: true,
        name: true,
        activeStrikes: true,
        bookings: {
          where: {
            createdAt: { gte: sevenDaysAgo }
          },
          select: { id: true }
        }
      }
    });

    usersWithStrikes.forEach(user => {
      if (user.bookings.length > 0) {
        abusePatterns.push({
          pattern: 'High-strike user booking',
          count: user.bookings.length,
          severity: user.activeStrikes >= 3 ? 'high' : 'medium',
          userId: user.id,
          description: `User with ${user.activeStrikes} strikes made ${user.bookings.length} bookings`,
          recommendations: [
            'Consider additional verification for this user',
            'Review no-show history',
            'Apply stricter booking limits'
          ]
        });
      }
    });

    // 7. MULTI-ACCOUNT SAME IP - Check for multiple accounts from same IP (from sessions)
    const recentSessions = await prisma.session.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        ipAddress: { not: null }
      },
      select: {
        ipAddress: true,
        userId: true
      }
    });

    const ipToUsers = new Map<string, Set<string>>();
    recentSessions.forEach(session => {
      if (session.ipAddress) {
        const users = ipToUsers.get(session.ipAddress) || new Set();
        users.add(session.userId);
        ipToUsers.set(session.ipAddress, users);
      }
    });

    ipToUsers.forEach((users, ip) => {
      if (users.size >= 3) {
        abusePatterns.push({
          pattern: 'Multi-account same IP',
          count: users.size,
          severity: users.size > 5 ? 'high' : 'low',
          description: `${users.size} different accounts from IP ${ip.substring(0, 10)}...`,
          recommendations: [
            'Investigate potential account farming',
            'Check if shared location (office, university)',
            'Review accounts for suspicious behavior'
          ]
        });
      }
    });

    return { suspiciousBookings, abusePatterns };
  }

  static async generateReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: BookingMetrics;
    anomalies: {
      suspiciousBookings: Array<{
        bookingId: string;
        reason: string;
        severity: 'low' | 'medium' | 'high';
      }>;
      abusePatterns: Array<{
        pattern: string;
        count: number;
        severity: 'low' | 'medium' | 'high';
      }>;
    };
    recommendations: string[];
  }> {
    const [summary, anomalies] = await Promise.all([
      this.getMetrics(startDate, endDate),
      this.detectAnomalies()
    ]);

    const recommendations: string[] = [];

    // Generate recommendations based on data
    if (summary.abuseAttempts > 10) {
      recommendations.push("Consider implementing stricter rate limiting");
    }

    if (summary.conflictResolutions > summary.totalBookings * 0.1) {
      recommendations.push("Consider implementing better availability checking");
    }

    if (anomalies.abusePatterns.some(pattern => pattern.severity === 'high')) {
      recommendations.push("Investigate high-severity abuse patterns immediately");
    }

    if (summary.cancelledBookings > summary.totalBookings * 0.2) {
      recommendations.push("Review booking cancellation policies");
    }

    return {
      summary,
      anomalies,
      recommendations
    };
  }
}

// Real-time monitoring
export class BookingMonitor {
  private static subscribers: Array<(event: BookingAuditEvent) => void> = [];

  static subscribe(callback: (event: BookingAuditEvent) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  static async notify(event: BookingAuditEvent): Promise<void> {
    // Notify all subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in booking monitor callback:', error);
      }
    });

    // Log the event
    await BookingAuditor.logEvent(event);
  }

  static async startMonitoring(): Promise<void> {
    console.log('Booking monitoring started');
  }
}
