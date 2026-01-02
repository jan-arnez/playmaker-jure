import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { createRateLimit } from "@/lib/security";

// Rate limiting for admin endpoints
const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 30 });

// GET: List all users with filters
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const banned = searchParams.get("banned");
    const trustLevel = searchParams.get("trustLevel");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role === "user" ? null : role;
    }

    if (banned === "true") {
      where.banned = true;
    } else if (banned === "false") {
      where.banned = false;
    }

    if (trustLevel) {
      where.trustLevel = parseInt(trustLevel);
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
          trustLevel: true,
          weeklyBookingLimit: true,
          successfulBookings: true,
          activeStrikes: true,
          lastStrikeAt: true,
          bookingBanUntil: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + users.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PATCH: Update user (ban, unban, update trust, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action, ...data } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId and action are required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "ban":
        const banExpires = data.banDuration
          ? new Date(Date.now() + data.banDuration * 24 * 60 * 60 * 1000)
          : null;
        result = await prisma.user.update({
          where: { id: userId },
          data: {
            banned: true,
            banReason: data.banReason || "Banned by admin",
            banExpires,
          },
        });
        break;

      case "unban":
        result = await prisma.user.update({
          where: { id: userId },
          data: {
            banned: false,
            banReason: null,
            banExpires: null,
          },
        });
        break;

      case "updateTrustLevel":
        result = await prisma.user.update({
          where: { id: userId },
          data: {
            trustLevel: data.trustLevel,
            weeklyBookingLimit: data.weeklyBookingLimit,
          },
        });
        break;

      case "resetStrikes":
        result = await prisma.user.update({
          where: { id: userId },
          data: {
            activeStrikes: 0,
            lastStrikeAt: null,
            bookingBanUntil: null,
          },
        });
        break;

      case "updateProfile":
        result = await prisma.user.update({
          where: { id: userId },
          data: {
            name: data.name,
            email: data.email,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // TODO: Log admin action to audit log (Phase 4)

    return NextResponse.json({
      success: true,
      data: result,
      message: `User ${action} successful`,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
