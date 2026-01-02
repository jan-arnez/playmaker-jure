import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/modules/auth/lib/auth";

// POST /api/bookings/seasonal/[seriesId]/activate - Activate a seasonal series
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seriesId } = await params;
    const body = await request.json();
    const { skipConflictCheck = false } = body;

    // Get all bookings in the series
    const seriesBookings = await prisma.booking.findMany({
      where: { seasonalSeriesId: seriesId },
      include: {
        court: {
          include: {
            sportCategory: {
              include: {
                facility: {
                  select: {
                    organizationId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (seriesBookings.length === 0) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    // Check authorization - user must have access to the organization
    const firstBooking = seriesBookings[0];
    
    // Check if already active
    if (firstBooking.status === "active") {
      return NextResponse.json(
        { error: "Series is already active" },
        { status: 400 }
      );
    }

    // Check if payment status is "paid"
    if (firstBooking.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Cannot activate - payment must be marked as Paid first" },
        { status: 400 }
      );
    }

    // If not skipping conflict check, find conflicts
    if (!skipConflictCheck) {
      const conflicts: Array<{
        date: string;
        time: string;
        courtName: string;
        existingBookingId: string;
      }> = [];

      for (const booking of seriesBookings) {
        // Check for existing confirmed/active bookings at the same time slot
        const existingBookings = await prisma.booking.findMany({
          where: {
            courtId: booking.courtId,
            id: { not: booking.id },
            startTime: {
              gte: booking.startTime,
              lt: booking.endTime,
            },
            status: {
              in: ["confirmed", "active"],
            },
            // Exclude bookings from the same series
            seasonalSeriesId: { not: seriesId },
          },
        });

        for (const existing of existingBookings) {
          conflicts.push({
            date: booking.startTime.toISOString().split('T')[0],
            time: booking.startTime.toTimeString().slice(0, 5),
            courtName: booking.court?.name || "Unknown",
            existingBookingId: existing.id,
          });
        }
      }

      if (conflicts.length > 0) {
        return NextResponse.json({
          hasConflicts: true,
          conflicts,
          message: `Found ${conflicts.length} conflicting booking(s)`,
        });
      }
    }

    // Activate all bookings in the series
    await prisma.booking.updateMany({
      where: { seasonalSeriesId: seriesId },
      data: { status: "active" },
    });

    return NextResponse.json({
      success: true,
      message: "Seasonal series activated successfully",
      bookingsUpdated: seriesBookings.length,
    });
  } catch (error) {
    console.error("Error activating seasonal series:", error);
    return NextResponse.json(
      { error: "Failed to activate seasonal series" },
      { status: 500 }
    );
  }
}
