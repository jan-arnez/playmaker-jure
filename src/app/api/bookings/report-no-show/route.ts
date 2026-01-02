import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { reportNoShow } from "@/lib/trust-system";
import { z } from "zod";

const reportSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  reason: z.string().optional(),
});

/**
 * POST /api/bookings/report-no-show
 * Report a no-show for a booking (owner/staff only)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to report no-shows" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = reportSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { bookingId, reason } = parseResult.data;

    // Report the no-show
    const result = await reportNoShow(bookingId, session.user.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "No-show reported successfully",
      penaltyApplied: result.penaltyApplied,
    });
  } catch (error) {
    console.error("Report no-show error:", error);
    return NextResponse.json(
      { error: "Failed to report no-show" },
      { status: 500 }
    );
  }
}
