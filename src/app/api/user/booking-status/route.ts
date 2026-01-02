import { NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canUserBook } from "@/lib/trust-system";

/**
 * GET /api/user/booking-status
 * Get user's verification status and booking eligibility
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({
        isVerified: false,
        canBook: false,
        trustLevel: 0,
        weeklyBookingLimit: 0,
        reason: "Please log in to make bookings",
      });
    }

    const status = await canUserBook(session.user.id);

    return NextResponse.json({
      isVerified: status.trustLevel > 0,
      canBook: status.canBook,
      trustLevel: status.trustLevel,
      weeklyBookingLimit: status.weeklyLimit,
      weeklyBookingCount: status.weeklyCount,
      reason: status.reason,
    });
  } catch (error) {
    console.error("Booking status error:", error);
    return NextResponse.json(
      { error: "Failed to get booking status" },
      { status: 500 }
    );
  }
}
