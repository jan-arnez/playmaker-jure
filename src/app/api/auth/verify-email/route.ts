import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { verifyCode } from "@/lib/verification";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must contain only numbers"),
});

/**
 * POST /api/auth/verify-email
 * Verify the 6-digit code and update user status
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to verify your email" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = verifySchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid verification code format",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { code } = parseResult.data;

    // Verify the code
    const result = await verifyCode(session.user.id, code);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now make bookings.",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
