import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";
import { randomBytes } from "node:crypto";

function generateId(): string {
  return randomBytes(16).toString("base64url");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      courtId,
      seasonalStartDate,
      seasonalEndDate,
      dayOfWeek,
      startTime,
      endTime,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      price,
      status,
      paymentStatus,
    } = body;

    if (!courtId || !seasonalStartDate || !seasonalEndDate || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Court ID, dates, day of week, and times are required" },
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

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can create seasonal bookings.
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

    // Validate dates
    const start = new Date(seasonalStartDate);
    const end = new Date(seasonalEndDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Parse time strings (format: "HH:MM")
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Find or create user if customer email provided
    let userId = session.user.id;
    if (customerEmail) {
      let user = await prisma.user.findUnique({
        where: { email: customerEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: generateId(),
            name: customerName || "Customer",
            email: customerEmail,
            emailVerified: false,
            role: "user",
            banned: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      userId = user.id;
    }

    // Generate seasonal series ID
    const seriesId = generateId();

    // Generate all weekly bookings from start date to end date
    const bookings: Array<{
      id: string;
      facilityId: string;
      userId: string;
      courtId: string;
      startTime: Date;
      endTime: Date;
      status: string;
      isSeasonal: boolean;
      seasonalSeriesId: string;
      seasonalStartDate: Date;
      seasonalEndDate: Date;
      dayOfWeek: number;
      parentBookingId: string | null;
      notes: string | null;
      price: number | null;
      paymentStatus: string | null;
    }> = [];

    const currentDate = new Date(start);
    let parentBookingId: string | null = null;

    while (currentDate <= end) {
      // Check if current date matches the day of week
      if (currentDate.getDay() === dayOfWeek) {
        const bookingStartTime = new Date(currentDate);
        bookingStartTime.setHours(startHour, startMinute, 0, 0);
        
        const bookingEndTime = new Date(currentDate);
        bookingEndTime.setHours(endHour, endMinute, 0, 0);

        const bookingId = generateId();
        if (!parentBookingId) {
          parentBookingId = bookingId; // First booking is the parent
        }

        bookings.push({
          id: bookingId,
          facilityId: court.sportCategory.facility.id,
          userId,
          courtId,
          startTime: bookingStartTime,
          endTime: bookingEndTime,
          status: status || "confirmed",
          isSeasonal: true,
          seasonalSeriesId: seriesId,
          seasonalStartDate: start,
          seasonalEndDate: end,
          dayOfWeek,
          parentBookingId,
          notes: notes || null,
          price: price ? parseFloat(price) : null,
          paymentStatus: paymentStatus || "pending",
        });
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: "No bookings generated. Check date range and day of week." },
        { status: 400 }
      );
    }

    // Check for conflicts before creating
    for (const booking of bookings) {
      const conflicts = await prisma.booking.findFirst({
        where: {
          courtId: booking.courtId,
          status: { in: ["pending", "confirmed"] },
          OR: [
            {
              AND: [
                { startTime: { lte: booking.endTime } },
                { endTime: { gte: booking.startTime } },
              ],
            },
          ],
        },
      });

      if (conflicts) {
        return NextResponse.json(
          { 
            error: `Conflict detected for ${booking.startTime.toLocaleDateString()}. Please check availability.`,
            conflictDate: booking.startTime.toISOString(),
          },
          { status: 409 }
        );
      }
    }

    // Create all bookings in a transaction
    const createdBookings = await prisma.$transaction(
      bookings.map(booking => 
        prisma.booking.create({ data: booking })
      )
    );

    return NextResponse.json({
      seriesId,
      parentBookingId,
      bookingCount: createdBookings.length,
      bookings: createdBookings,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating seasonal series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



