import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { sanitizeInput, validateEmail } from "@/lib/security";

// Generate a random ID similar to Better Auth format
function generateId(): string {
  const randomBytes = require("node:crypto").randomBytes;
  return randomBytes(16).toString("base64url");
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is logged in (required)
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in to join waitlist" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { facilityId, courtId, startTime, endTime, email, phone, name } = body;

    // Validate required fields
    if (!facilityId || !courtId || !startTime || !endTime || !email) {
      return NextResponse.json(
        { error: "Missing required fields: facilityId, courtId, startTime, endTime, email" },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      facilityId: sanitizeInput(facilityId),
      courtId: sanitizeInput(courtId),
      email: sanitizeInput(email),
      phone: phone ? sanitizeInput(phone) : null,
      name: name ? sanitizeInput(name) : null,
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

    // Verify facility and court exist
    const facility = await prisma.facility.findUnique({
      where: { id: sanitizedData.facilityId },
    });

    if (!facility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 },
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

    // Check if user is already in waitlist for this slot
    const userWaitlist = await prisma.waitlist.findFirst({
      where: {
        courtId: sanitizedData.courtId,
        startTime: slotStartTime,
        endTime: slotEndTime,
        userId: session.user.id,
        status: {
          in: ["waitlist", "notified"],
        },
      },
    });

    if (userWaitlist) {
      return NextResponse.json(
        { error: "You are already on the waitlist for this slot" },
        { status: 409 },
      );
    }

    // Create waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        id: generateId(),
        facilityId: sanitizedData.facilityId,
        courtId: sanitizedData.courtId,
        userId: session.user.id,
        startTime: slotStartTime,
        endTime: slotEndTime,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        name: sanitizedData.name || session.user.name || null,
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
    console.error("Waitlist creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

