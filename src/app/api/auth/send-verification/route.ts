import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { sendVerificationCode } from "@/lib/verification";
import { createRateLimit } from "@/lib/security";

// Rate limit: 1 request per 60 seconds per user
const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 1 });

/**
 * POST /api/auth/send-verification
 * Send a 6-digit verification code to the user's email
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
      return NextResponse.json(
        { error: "Please wait before requesting another code" },
        { status: 429 }
      );
    }

    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to verify your email" },
        { status: 401 }
      );
    }

    // Send verification code
    const result = await sendVerificationCode(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          cooldownRemaining: result.cooldownRemaining,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
