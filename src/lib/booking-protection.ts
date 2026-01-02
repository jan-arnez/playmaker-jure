import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BookingConflict {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  customerName: string;
  customerEmail: string;
}

export interface AbuseDetectionResult {
  isAbuse: boolean;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  blocked: boolean;
}

// Enhanced booking validation
export class BookingValidator {
  static async validateBooking(data: {
    facilityId: string;
    startTime: Date;
    endTime: Date;
    email: string;
    name: string;
  }): Promise<BookingValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!data.facilityId) errors.push("Facility ID is required");
    if (!data.startTime) errors.push("Start time is required");
    if (!data.endTime) errors.push("End time is required");
    if (!data.email) errors.push("Email is required");
    if (!data.name) errors.push("Name is required");

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Time validation
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const maxBookingTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    if (data.startTime < minBookingTime) {
      errors.push("Booking must be at least 30 minutes in advance");
    }

    if (data.startTime > maxBookingTime) {
      errors.push("Booking cannot be more than 1 year in advance");
    }

    if (data.startTime >= data.endTime) {
      errors.push("End time must be after start time");
    }

    // Duration validation
    const duration = data.endTime.getTime() - data.startTime.getTime();
    const minDuration = 30 * 60 * 1000; // 30 minutes
    const maxDuration = 8 * 60 * 60 * 1000; // 8 hours

    if (duration < minDuration) {
      errors.push("Minimum booking duration is 30 minutes");
    }

    if (duration > maxDuration) {
      errors.push("Maximum booking duration is 8 hours");
    }

    // Business hours validation
    const startHour = data.startTime.getHours();
    const endHour = data.endTime.getHours();
    const isWeekend = data.startTime.getDay() === 0 || data.startTime.getDay() === 6;

    if (startHour < 6 || endHour > 22) {
      warnings.push("Booking is outside normal business hours (6 AM - 10 PM)");
    }

    if (isWeekend) {
      warnings.push("Booking is on a weekend");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format");
    }

    // Name validation (minimum 2 characters, no special characters)
    if (data.name.length < 2) {
      errors.push("Name must be at least 2 characters long");
    }

    const nameRegex = /^[a-zA-Z\s\u00C0-\u017F]+$/; // Allow letters, spaces, and accented characters
    if (!nameRegex.test(data.name)) {
      errors.push("Name contains invalid characters");
    }

    // Check facility availability
    const facility = await prisma.facility.findUnique({
      where: { id: data.facilityId },
      include: { organization: true }
    });

    if (!facility) {
      errors.push("Facility not found");
    } else {
      // Check if facility is active
      if (!facility.organization) {
        errors.push("Facility organization not found");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static async checkConflicts(data: {
    facilityId: string;
    startTime: Date;
    endTime: Date;
    excludeBookingId?: string;
  }): Promise<BookingConflict[]> {
    const conflicts = await prisma.booking.findMany({
      where: {
        facilityId: data.facilityId,
        status: {
          in: ["confirmed", "pending"]
        },
        ...(data.excludeBookingId && { id: { not: data.excludeBookingId } }),
        OR: [
          {
            startTime: {
              lt: data.endTime
            },
            endTime: {
              gt: data.startTime
            }
          }
        ]
      },
      include: {
        user: true
      }
    });

    return conflicts.map(conflict => ({
      id: conflict.id,
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      status: conflict.status,
      customerName: conflict.user.name || "Unknown",
      customerEmail: conflict.user.email
    }));
  }
}

// Abuse detection system
export class AbuseDetector {
  static async detectAbuse(request: NextRequest, bookingData: {
    email: string;
    name: string;
    facilityId: string;
    startTime: Date;
    endTime: Date;
  }): Promise<AbuseDetectionResult> {
    const ip = this.getClientIP(request);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for rapid bookings from same IP
    const recentBookingsFromIP = await prisma.booking.count({
      where: {
        createdAt: {
          gte: oneHourAgo
        },
        user: {
          email: bookingData.email
        }
      }
    });

    if (recentBookingsFromIP >= 3) {
      return {
        isAbuse: true,
        reason: "Too many bookings in the last hour",
        severity: "high",
        blocked: true
      };
    }

    // Check for duplicate bookings
    const duplicateBooking = await prisma.booking.findFirst({
      where: {
        facilityId: bookingData.facilityId,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        user: {
          email: bookingData.email
        }
      }
    });

    if (duplicateBooking) {
      return {
        isAbuse: true,
        reason: "Duplicate booking detected",
        severity: "medium",
        blocked: true
      };
    }

    // Check for suspicious patterns
    const suspiciousBookings = await prisma.booking.count({
      where: {
        user: {
          email: bookingData.email
        },
        createdAt: {
          gte: oneDayAgo
        },
        status: "cancelled"
      }
    });

    if (suspiciousBookings >= 5) {
      return {
        isAbuse: true,
        reason: "High cancellation rate detected",
        severity: "medium",
        blocked: false
      };
    }

    // Check for unusual booking times (outside business hours)
    const bookingHour = bookingData.startTime.getHours();
    if (bookingHour < 6 || bookingHour > 22) {
      return {
        isAbuse: true,
        reason: "Booking at unusual time (outside business hours)",
        severity: "medium",
        blocked: false
      };
    }

    // Check for rapid bookings from same IP (enhanced)
    const recentBookingsFromIPEnhanced = await prisma.booking.count({
      where: {
        createdAt: {
          gte: oneHourAgo
        },
        user: {
          email: bookingData.email
        }
      }
    });

    if (recentBookingsFromIPEnhanced >= 3) {
      return {
        isAbuse: true,
        reason: "Too many bookings in the last hour",
        severity: "high",
        blocked: true
      };
    }

    // Check for fake email patterns
    const suspiciousEmails = [
      'test@test.com',
      'fake@fake.com',
      'spam@spam.com',
      'admin@admin.com'
    ];

    if (suspiciousEmails.includes(bookingData.email.toLowerCase())) {
      return {
        isAbuse: true,
        reason: "Suspicious email pattern",
        severity: "high",
        blocked: true
      };
    }

    // Check for suspicious names
    const suspiciousNames = ['test', 'fake', 'spam', 'admin', 'user'];
    const nameLower = bookingData.name.toLowerCase();
    
    if (suspiciousNames.some(suspicious => nameLower.includes(suspicious))) {
      return {
        isAbuse: true,
        reason: "Suspicious name pattern",
        severity: "medium",
        blocked: false
      };
    }

    return {
      isAbuse: false,
      reason: "",
      severity: "low",
      blocked: false
    };
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");
    
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
}

// Booking locks for atomic operations
export class BookingLock {
  private static locks = new Map<string, { timestamp: number; timeout: number }>();
  private static readonly LOCK_TIMEOUT = 30000; // 30 seconds

  static async acquireLock(bookingKey: string): Promise<boolean> {
    const now = Date.now();
    const existingLock = this.locks.get(bookingKey);

    if (existingLock) {
      // Check if lock is expired
      if (now - existingLock.timestamp > existingLock.timeout) {
        this.locks.delete(bookingKey);
      } else {
        return false; // Lock is still active
      }
    }

    // Acquire new lock
    this.locks.set(bookingKey, {
      timestamp: now,
      timeout: this.LOCK_TIMEOUT
    });

    return true;
  }

  static releaseLock(bookingKey: string): void {
    this.locks.delete(bookingKey);
  }

  static async withLock<T>(
    bookingKey: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const acquired = await this.acquireLock(bookingKey);
    
    if (!acquired) {
      throw new Error("Could not acquire booking lock");
    }

    try {
      return await operation();
    } finally {
      this.releaseLock(bookingKey);
    }
  }
}

// Enhanced conflict resolution
export class ConflictResolver {
  static async resolveConflicts(
    facilityId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<{
    hasConflicts: boolean;
    conflicts: BookingConflict[];
    suggestedTimes: Date[];
  }> {
    const conflicts = await BookingValidator.checkConflicts({
      facilityId,
      startTime,
      endTime,
      excludeBookingId
    });

    if (conflicts.length === 0) {
      return {
        hasConflicts: false,
        conflicts: [],
        suggestedTimes: []
      };
    }

    // Generate suggested alternative times
    const suggestedTimes = await this.generateSuggestedTimes(
      facilityId,
      startTime,
      endTime
    );

    return {
      hasConflicts: true,
      conflicts,
      suggestedTimes
    };
  }

  private static async generateSuggestedTimes(
    facilityId: string,
    originalStart: Date,
    originalEnd: Date
  ): Promise<Date[]> {
    const duration = originalEnd.getTime() - originalStart.getTime();
    const suggestions: Date[] = [];
    
    // Try same day, different times
    for (let hourOffset = 1; hourOffset <= 6; hourOffset++) {
      const suggestedStart = new Date(originalStart.getTime() + hourOffset * 60 * 60 * 1000);
      const suggestedEnd = new Date(suggestedStart.getTime() + duration);
      
      const conflicts = await BookingValidator.checkConflicts({
        facilityId,
        startTime: suggestedStart,
        endTime: suggestedEnd
      });
      
      if (conflicts.length === 0) {
        suggestions.push(suggestedStart);
        if (suggestions.length >= 3) break;
      }
    }

    // Try next day
    const nextDayStart = new Date(originalStart);
    nextDayStart.setDate(nextDayStart.getDate() + 1);
    const nextDayEnd = new Date(nextDayStart.getTime() + duration);
    
    const nextDayConflicts = await BookingValidator.checkConflicts({
      facilityId,
      startTime: nextDayStart,
      endTime: nextDayEnd
    });
    
    if (nextDayConflicts.length === 0) {
      suggestions.push(nextDayStart);
    }

    return suggestions;
  }
}
