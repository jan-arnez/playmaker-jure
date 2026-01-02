import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/modules/auth/lib/auth";

// POST /api/bookings/seasonal/request - User submits a seasonal term request
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustLevel: true },
    });

    // Check trust level >= 2
    if (!user || (user.trustLevel ?? 0) < 2) {
      return NextResponse.json(
        { error: "You must complete at least one booking before requesting seasonal terms" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      courtId,
      seasonalStartDate,
      seasonalEndDate,
      dayOfWeek,
      startTime,
      endTime,
      notes,
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

    // Parse dates
    const start = new Date(seasonalStartDate);
    const end = new Date(seasonalEndDate);

    if (end <= start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Generate unique series ID
    const seriesId = crypto.randomUUID();
    const parentBookingId = crypto.randomUUID();

    // Calculate all booking dates
    const bookings: any[] = [];
    const currentDate = new Date(start);
    
    // Find first occurrence of the target day
    while (currentDate.getDay() !== dayOfWeek && currentDate <= end) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate all bookings in the series
    while (currentDate <= end) {
      if (currentDate.getDay() === dayOfWeek) {
        const bookingId = crypto.randomUUID();
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        const bookingStartTime = new Date(currentDate);
        bookingStartTime.setHours(startHour, startMinute, 0, 0);

        const bookingEndTime = new Date(currentDate);
        bookingEndTime.setHours(endHour, endMinute, 0, 0);

        bookings.push({
          id: bookingId,
          facilityId: court.sportCategory.facility.id,
          userId,
          courtId,
          startTime: bookingStartTime,
          endTime: bookingEndTime,
          status: "pending", // User requests start as pending
          isSeasonal: true,
          seasonalSeriesId: seriesId,
          seasonalStartDate: start,
          seasonalEndDate: end,
          dayOfWeek,
          parentBookingId,
          notes: notes || null,
          paymentStatus: "pending",
        });
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: "No bookings could be generated for the specified criteria" },
        { status: 400 }
      );
    }

    // Create all bookings
    await prisma.booking.createMany({
      data: bookings,
    });

    return NextResponse.json({
      success: true,
      seriesId,
      bookingsCreated: bookings.length,
      message: "Seasonal term request submitted successfully",
    });
  } catch (error) {
    console.error("Error creating seasonal term request:", error);
    return NextResponse.json(
      { error: "Failed to create seasonal term request" },
      { status: 500 }
    );
  }
}
