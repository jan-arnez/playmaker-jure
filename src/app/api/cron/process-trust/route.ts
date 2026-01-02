import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processBookingCompletion, expireOldStrikes } from "@/lib/trust-system";

// Secret key to protect cron endpoint (set in environment)
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/process-trust
 * Cron job to:
 * 1. Process completed bookings (2+ hours past end time) and promote users
 * 2. Expire old strikes (60+ days old)
 * 
 * This should be called hourly by a cron service (e.g., Vercel Cron, GitHub Actions)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security layer)
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Find bookings that ended 2+ hours ago and haven't been processed
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: "confirmed",
        endTime: { lt: twoHoursAgo },
        // Only process bookings that haven't been marked as completed
        // We'll use the notes field or add a new field to track this
      },
      include: {
        noShowReport: true,
      },
      take: 100, // Process in batches
    });

    let promotedCount = 0;
    let processedCount = 0;

    for (const booking of completedBookings) {
      // Skip if already has a no-show report
      if (booking.noShowReport) {
        continue;
      }

      const result = await processBookingCompletion(booking.id);
      processedCount++;
      
      if (result.promoted) {
        promotedCount++;
      }

      // Mark booking as completed (change status)
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "completed" },
      });
    }

    // Expire old strikes
    const expiredStrikes = await expireOldStrikes();

    return NextResponse.json({
      success: true,
      processed: processedCount,
      promoted: promotedCount,
      expiredStrikes,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron process-trust error:", error);
    return NextResponse.json(
      { error: "Failed to process trust updates" },
      { status: 500 }
    );
  }
}
