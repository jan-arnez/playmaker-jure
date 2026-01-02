import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get user's reservations with facility details
    const reservations = await prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        facility: {
          select: {
            name: true,
            address: true,
            city: true,
            locationType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Check if there are more reservations
    const totalCount = await prisma.booking.count({
      where: {
        userId,
      },
    });

    const hasMore = offset + limit < totalCount;

    // Format reservations for the frontend
    const formattedReservations = reservations.map(booking => ({
      id: booking.id,
      facilityName: booking.facility.name,
      sport: booking.facility.sport || "General",
      date: booking.startTime.toISOString().split('T')[0],
      time: booking.startTime.toISOString().split('T')[1].substring(0, 5),
      status: booking.status as "confirmed" | "pending" | "cancelled" | "completed",
      price: 25, // Default price since totalAmount doesn't exist
      location: `${booking.facility.address}, ${booking.facility.city}`,
      canRebook: booking.status === "completed" && 
        new Date(booking.startTime) < new Date(), // Can rebook if past booking
    }));

    return NextResponse.json({
      reservations: formattedReservations,
      hasMore,
      totalCount,
    });

  } catch (error) {
    console.error("Reservations fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
