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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get games played this month
    const gamesThisMonth = await prisma.booking.count({
      where: {
        userId,
        status: "completed",
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Get total games played
    const totalGames = await prisma.booking.count({
      where: {
        userId,
        status: "completed",
      },
    });

    // Get favorite sport (most booked sport) - using facility sport
    const sportStats = await prisma.booking.groupBy({
      by: ["facilityId"],
      where: {
        userId,
        status: "completed",
      },
      _count: {
        facilityId: true,
      },
      orderBy: {
        _count: {
          facilityId: "desc",
        },
      },
      take: 1,
    });

    // Get the sport from the most booked facility
    let favoriteSport = "None";
    if (sportStats.length > 0) {
      const facility = await prisma.facility.findUnique({
        where: { id: sportStats[0].facilityId },
        select: { locationType: true },
      });
      favoriteSport = facility?.locationType || "None";
    }

    // Get average rating (if ratings exist)
    const averageRating = 4.5; // This would come from a ratings table

    // Get total spent (using a default price since totalAmount doesn't exist)
    const totalSpent = totalGames * 25; // Default price per booking

    const analytics = {
      gamesPlayedThisMonth: gamesThisMonth,
      totalGamesPlayed: totalGames,
      favoriteSport,
      averageRating,
      totalSpent,
      weeklyGoal: 3, // Default weekly goal
      currentStreak: Math.min(gamesThisMonth, 7), // Simple streak calculation
      nextBooking: null, // Would be calculated based on upcoming bookings
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
