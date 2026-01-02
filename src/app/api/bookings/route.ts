import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimit, sanitizeInput, validateEmail } from "@/lib/security";
import { 
  BookingValidator, 
  AbuseDetector, 
  BookingLock, 
  ConflictResolver 
} from "@/lib/booking-protection";
import { BookingAuditor, BookingMonitor } from "@/lib/booking-audit";

// Enhanced rate limiting: 5 requests per minute per IP for booking creation
const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 5 });

// Generate a random ID similar to Better Auth format
function generateId(): string {
  const randomBytes = require("node:crypto").randomBytes;
  return randomBytes(16).toString("base64url");
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let bookingId: string | null = null;

  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
      await BookingAuditor.logEvent({
        bookingId: 'unknown',
        action: 'created',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: 'rate_limited' },
        severity: 'medium'
      });
      return rateLimitResponse;
    }

    const body = await request.json();
    const { facilityId, name, email, date, startTime, endTime, notes } = body;

    // Sanitize inputs
    const sanitizedData = {
      facilityId: sanitizeInput(facilityId),
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      date: sanitizeInput(date),
      startTime: sanitizeInput(startTime),
      endTime: sanitizeInput(endTime),
      notes: notes ? sanitizeInput(notes) : null,
    };

    // Enhanced validation
    const validation = await BookingValidator.validateBooking({
      facilityId: sanitizedData.facilityId,
      startTime: new Date(`${sanitizedData.date}T${sanitizedData.startTime}`),
      endTime: new Date(`${sanitizedData.date}T${sanitizedData.endTime}`),
      email: sanitizedData.email,
      name: sanitizedData.name
    });

    if (!validation.isValid) {
      await BookingAuditor.logEvent({
        bookingId: 'unknown',
        action: 'created',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { 
          reason: 'validation_failed',
          errors: validation.errors,
          warnings: validation.warnings
        },
        severity: 'medium'
      });

      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // Abuse detection
    const abuseDetection = await AbuseDetector.detectAbuse(request, {
      email: sanitizedData.email,
      name: sanitizedData.name,
      facilityId: sanitizedData.facilityId,
      startTime: new Date(`${sanitizedData.date}T${sanitizedData.startTime}`),
      endTime: new Date(`${sanitizedData.date}T${sanitizedData.endTime}`)
    });

    if (abuseDetection.isAbuse) {
      await BookingAuditor.logEvent({
        bookingId: 'unknown',
        action: 'created',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { 
          reason: 'abuse_detected',
          abuseReason: abuseDetection.reason,
          severity: abuseDetection.severity
        },
        severity: abuseDetection.severity === 'high' ? 'critical' : 'high'
      });

      if (abuseDetection.blocked) {
        return NextResponse.json(
          { 
            error: "Booking request blocked", 
            reason: abuseDetection.reason,
            severity: abuseDetection.severity
          },
          { status: 429 }
        );
      }
    }

    // Create booking with atomic lock
    const bookingKey = `${sanitizedData.facilityId}-${sanitizedData.date}-${sanitizedData.startTime}`;
    
    const result = await BookingLock.withLock(bookingKey, async () => {
      // Double-check for conflicts within the lock
      const conflicts = await BookingValidator.checkConflicts({
        facilityId: sanitizedData.facilityId,
        startTime: new Date(`${sanitizedData.date}T${sanitizedData.startTime}`),
        endTime: new Date(`${sanitizedData.date}T${sanitizedData.endTime}`)
      });

      if (conflicts.length > 0) {
        const conflictResolution = await ConflictResolver.resolveConflicts(
          sanitizedData.facilityId,
          new Date(`${sanitizedData.date}T${sanitizedData.startTime}`),
          new Date(`${sanitizedData.date}T${sanitizedData.endTime}`)
        );

        throw new Error(JSON.stringify({
          type: 'conflict',
          conflicts: conflicts,
          suggestedTimes: conflictResolution.suggestedTimes
        }));
      }

      // Create or find user
      let user = await prisma.user.findUnique({
        where: { email: sanitizedData.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: generateId(),
            name: sanitizedData.name,
            email: sanitizedData.email,
            emailVerified: false,
            role: "user",
            banned: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          id: generateId(),
          facilityId: sanitizedData.facilityId,
          userId: user.id,
          startTime: new Date(`${sanitizedData.date}T${sanitizedData.startTime}`),
          endTime: new Date(`${sanitizedData.date}T${sanitizedData.endTime}`),
          status: "pending",
          notes: sanitizedData.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      bookingId = booking.id;
      return booking;
    });

    // Log successful booking creation
    await BookingAuditor.logEvent({
      bookingId: result.id,
      action: 'created',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        facilityId: sanitizedData.facilityId,
        duration: result.endTime.getTime() - result.startTime.getTime(),
        processingTime: Date.now() - startTime
      },
      severity: 'low'
    });

    // Notify monitoring system
    await BookingMonitor.notify({
      id: generateId(),
      bookingId: result.id,
      action: 'created',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        facilityId: sanitizedData.facilityId,
        customerEmail: sanitizedData.email,
        customerName: sanitizedData.name
      },
      timestamp: new Date(),
      severity: 'low'
    });

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking: {
          id: result.id,
          status: result.status,
          startTime: result.startTime,
          endTime: result.endTime,
          warnings: validation.warnings
        },
        processingTime: Date.now() - startTime
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Booking creation error:", error);

    // Handle conflict errors specially
    if (error instanceof Error && error.message.startsWith('{"type":"conflict"')) {
      try {
        const conflictData = JSON.parse(error.message);
        return NextResponse.json(
          {
            error: "Time slot is already booked",
            conflicts: conflictData.conflicts,
            suggestedTimes: conflictData.suggestedTimes,
            type: "conflict"
          },
          { status: 409 }
        );
      } catch (parseError) {
        // Fall through to generic error handling
      }
    }

    // Log error
    await BookingAuditor.logEvent({
      bookingId: bookingId || 'unknown',
      action: 'created',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { 
        reason: 'creation_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      severity: 'high'
    });

    return NextResponse.json(
      { 
        error: "Internal server error",
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}