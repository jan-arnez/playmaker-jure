import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { sanitizeInput, validateEmail } from "@/lib/security";
import { randomBytes } from "node:crypto";

// Generate a random ID similar to Better Auth format
function generateId(): string {
  return randomBytes(16).toString("base64url");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { facilityId, courtId, startTime, endTime, name, email, phone } = body;

    if (!facilityId || !courtId || !startTime || !endTime || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: facilityId, courtId, startTime, endTime, name, email" },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      facilityId: sanitizeInput(facilityId),
      courtId: sanitizeInput(courtId),
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      phone: phone ? sanitizeInput(phone) : null,
    };

    // Validate email format
    if (!validateEmail(sanitizedData.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Parse dates
    const slotStartTime = new Date(startTime);
    const slotEndTime = new Date(endTime);

    if (isNaN(slotStartTime.getTime()) || isNaN(slotEndTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    if (slotStartTime >= slotEndTime) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 },
      );
    }

    // Get facility info
    const facility = await prisma.facility.findUnique({
      where: { id: sanitizedData.facilityId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!facility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 },
      );
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can create manual waitlist entries.
     * Member.role === "admin" does NOT exist.
     */
    const { canPerformOwnerActions } = await import("@/lib/check-organization-access");
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }



    const court = await prisma.court.findUnique({
      where: { id: sanitizedData.courtId },
    });

    if (!court) {
      return NextResponse.json(
        { error: "Court not found" },
        { status: 404 },
      );
    }

    // Check if slot is already booked (position 1)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        courtId: sanitizedData.courtId,
        status: {
          in: ["confirmed", "pending"],
        },
        OR: [
          {
            startTime: {
              lt: slotEndTime,
            },
            endTime: {
              gt: slotStartTime,
            },
          },
        ],
      },
    });

    // Slot must be booked to join waitlist
    if (!existingBooking) {
      return NextResponse.json(
        { error: "Slot is not booked. Waitlist is only available for booked slots." },
        { status: 400 },
      );
    }

    // Check if there's already someone in waitlist (position 2)
    const existingWaitlist = await prisma.waitlist.findFirst({
      where: {
        courtId: sanitizedData.courtId,
        startTime: slotStartTime,
        endTime: slotEndTime,
        status: "waitlist",
      },
    });

    if (existingWaitlist) {
      return NextResponse.json(
        { error: "Waitlist is full. Only 1 person can be on the waitlist per slot." },
        { status: 409 },
      );
    }

    // Find or create user by email
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

    // Check if user is already in waitlist for this slot
    const userWaitlist = await prisma.waitlist.findFirst({
      where: {
        courtId: sanitizedData.courtId,
        startTime: slotStartTime,
        endTime: slotEndTime,
        userId: user.id,
        status: {
          in: ["waitlist", "notified"],
        },
      },
    });

    if (userWaitlist) {
      return NextResponse.json(
        { error: "This customer is already on the waitlist for this slot" },
        { status: 409 },
      );
    }

    // Create waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        id: generateId(),
        facilityId: sanitizedData.facilityId,
        courtId: sanitizedData.courtId,
        userId: user.id,
        startTime: slotStartTime,
        endTime: slotEndTime,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        name: sanitizedData.name,
        status: "waitlist",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        waitlist: {
          id: waitlistEntry.id,
          position: 2, // Position 1 is the booked person, position 2 is waitlist
          status: waitlistEntry.status,
          courtId: waitlistEntry.courtId,
          startTime: waitlistEntry.startTime,
          endTime: waitlistEntry.endTime,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Manual waitlist creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

