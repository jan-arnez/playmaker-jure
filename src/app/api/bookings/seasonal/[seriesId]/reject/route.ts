import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

interface RouteParams {
  params: Promise<{
    seriesId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const seriesId = resolvedParams.seriesId;

    // Get first booking to check organization access
    const firstBooking = await prisma.booking.findFirst({
      where: {
        seasonalSeriesId: seriesId,
      },
      include: {
        court: {
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
        },
      },
    });

    if (!firstBooking) {
      return NextResponse.json({ error: "Seasonal series not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can reject seasonal bookings.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      firstBooking.court.sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update all bookings in the series
    const result = await prisma.booking.updateMany({
      where: {
        seasonalSeriesId: seriesId,
      },
      data: {
        status: "rejected",
      },
    });

    return NextResponse.json({
      message: "Seasonal series rejected",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error rejecting seasonal series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



