import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      facilityId,
      courtId,
      customerName,
      customerEmail,
      customerPhone,
      startTime,
      endTime,
      status = "confirmed",
      notes,
    } = body;

    if (!facilityId || !courtId || !customerName || !customerEmail || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Facility ID, court ID, customer name, email, and times are required" },
        { status: 400 }
      );
    }

    // Get court and facility info
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        sportCategory: {
          include: {
            facility: {
              select: {
                id: true,
                organizationId: true,
              },
            },
          },
        },
      },
    });

    if (!court) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }

    // Verify facility matches
    if (court.sportCategory.facility.id !== facilityId) {
      return NextResponse.json({ error: "Court does not belong to this facility" }, { status: 400 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can create manual bookings.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      court.sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const bookingStartTime = new Date(startTime);
    const bookingEndTime = new Date(endTime);

    if (bookingStartTime >= bookingEndTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check for conflicts (bookings and blocked slots)
    const conflicts = await prisma.booking.findMany({
      where: {
        courtId: courtId,
        status: {
          in: ["confirmed", "pending"],
        },
        OR: [
          {
            startTime: {
              lt: bookingEndTime,
            },
            endTime: {
              gt: bookingStartTime,
            },
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: "Time slot is already booked", conflicts },
        { status: 409 }
      );
    }

    // Check for blocked slots
    const blockedSlots = await prisma.slotBlock.findMany({
      where: {
        courtId: courtId,
        OR: [
          {
            startTime: {
              lt: bookingEndTime,
            },
            endTime: {
              gt: bookingStartTime,
            },
          },
        ],
      },
    });

    if (blockedSlots.length > 0) {
      return NextResponse.json(
        { error: "Time slot is blocked", blockedSlots },
        { status: 409 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: generateId(),
          name: customerName,
          email: customerEmail,
          emailVerified: false,
          role: "user",
          banned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Update user name if it's different
      if (user.name !== customerName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: customerName },
        });
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        id: generateId(),
        facilityId: facilityId,
        courtId: courtId,
        userId: user.id,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        status: status,
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        court: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual booking creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

