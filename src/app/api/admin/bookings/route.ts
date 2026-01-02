import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { createRateLimit } from "@/lib/security";

const rateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 30 });

// GET: List all bookings with filters
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const facilityId = searchParams.get("facilityId");
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const isSeasonal = searchParams.get("isSeasonal");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, any> = {};

    if (status) {
      where.status = status;
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) where.startTime.gte = new Date(dateFrom);
      if (dateTo) where.startTime.lte = new Date(dateTo);
    }

    if (isSeasonal !== null) {
      where.isSeasonal = isSeasonal === "true";
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          price: true,
          paymentStatus: true,
          isSeasonal: true,
          seasonalSeriesId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
              organization: {
                select: { name: true },
              },
            },
          },
          court: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + bookings.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// PATCH: Update booking status (cancel, complete)
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, action, ...data } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: "bookingId and action are required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "cancel":
        result = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "cancelled",
          },
        });
        break;

      case "confirm":
        result = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "confirmed" },
        });
        break;

      case "complete":
        result = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "completed" },
        });
        break;

      case "updatePayment":
        result = await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: data.paymentStatus },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // TODO: Log to audit log (Phase 4)

    return NextResponse.json({
      success: true,
      data: result,
      message: `Booking ${action} successful`,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
