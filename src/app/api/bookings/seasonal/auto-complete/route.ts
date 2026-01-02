import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/modules/auth/lib/auth";

// POST /api/bookings/seasonal/auto-complete - Auto-complete expired seasonal series
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all active seasonal series where the end date has passed
    // We look for distinct seasonalSeriesIds where all bookings have ended
    const expiredSeriesIds = await prisma.booking.groupBy({
      by: ['seasonalSeriesId'],
      where: {
        isSeasonal: true,
        status: 'active',
        seasonalSeriesId: { not: null },
        seasonalEndDate: { lt: now },
      },
      _max: {
        seasonalEndDate: true,
      },
    });

    if (expiredSeriesIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired series found",
        seriesCompleted: 0,
      });
    }

    // Update all bookings in expired series to "completed"
    const seriesIdsToComplete = expiredSeriesIds
      .map(s => s.seasonalSeriesId)
      .filter((id): id is string => id !== null);

    const updateResult = await prisma.booking.updateMany({
      where: {
        seasonalSeriesId: { in: seriesIdsToComplete },
        status: { in: ['active', 'confirmed'] },
      },
      data: { status: 'completed' },
    });

    return NextResponse.json({
      success: true,
      message: `Auto-completed ${seriesIdsToComplete.length} expired series`,
      seriesCompleted: seriesIdsToComplete.length,
      bookingsUpdated: updateResult.count,
    });
  } catch (error) {
    console.error("Error auto-completing seasonal series:", error);
    return NextResponse.json(
      { error: "Failed to auto-complete seasonal series" },
      { status: 500 }
    );
  }
}
