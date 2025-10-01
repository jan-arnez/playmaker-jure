import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimit, sanitizeInput, validateEmail } from "@/lib/security";

// Rate limiting: 10 requests per minute per IP
const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

// Generate a random ID similar to Better Auth format
function generateId(): string {
  const randomBytes = require("node:crypto").randomBytes;
  return randomBytes(16).toString("base64url");
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
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

    // Validate required fields
    if (
      !sanitizedData.facilityId ||
      !sanitizedData.name ||
      !sanitizedData.email ||
      !sanitizedData.date ||
      !sanitizedData.startTime ||
      !sanitizedData.endTime
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(sanitizedData.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: sanitizedData.facilityId },
    });

    if (!facility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 }
      );
    }

    // Create or find user
    let user = await prisma.user.findUnique({
      where: { email: sanitizedData.email },
    });

    if (!user) {
      // Create a new user for the booking
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

    // Parse dates
    const startDateTime = new Date(
      `${sanitizedData.date}T${sanitizedData.startTime}`
    );
    const endDateTime = new Date(
      `${sanitizedData.date}T${sanitizedData.endTime}`
    );

    // Validate date/time
    if (startDateTime >= endDateTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    if (startDateTime < new Date()) {
      return NextResponse.json(
        { error: "Cannot book in the past" },
        { status: 400 }
      );
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        facilityId: sanitizedData.facilityId,
        status: {
          in: ["confirmed", "pending"],
        },
        OR: [
          {
            startTime: {
              lt: endDateTime,
            },
            endTime: {
              gt: startDateTime,
            },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Time slot is already booked" },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        id: generateId(),
        facilityId: sanitizedData.facilityId,
        userId: user.id,
        startTime: startDateTime,
        endTime: endDateTime,
        status: "pending",
        notes: sanitizedData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking: {
          id: booking.id,
          status: booking.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
