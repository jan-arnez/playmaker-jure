import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

// GET: Platform analytics data
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all metrics in parallel
    const [
      // Totals
      totalUsers,
      totalOrganizations,
      totalFacilities,
      totalBookings,
      
      // Recent activity (last 7 days)
      newUsersWeek,
      newBookingsWeek,
      
      // Last 30 days
      newUsersMonth,
      newBookingsMonth,
      
      // Bookings by status
      confirmedBookings,
      cancelledBookings,
      
      // User activity breakdown for charts (last 30 days)
      usersByDay,
      bookingsByDay,
    ] = await Promise.all([
      // Totals
      prisma.user.count(),
      prisma.organization.count(),
      prisma.facility.count(),
      prisma.booking.count(),
      
      // Recent activity
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.booking.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      
      // Monthly
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      
      // Booking status
      prisma.booking.count({ where: { status: "confirmed" } }),
      prisma.booking.count({ where: { status: "cancelled" } }),
      
      // Daily breakdown for charts
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Aggregate daily data for charts
    const dailyData: Record<string, { date: string; users: number; bookings: number }> = {};
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { date: dateStr, users: 0, bookings: 0 };
    }
    
    // Count users by day
    usersByDay.forEach((user) => {
      const dateStr = user.createdAt.toISOString().split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].users++;
      }
    });
    
    // Count bookings by day
    bookingsByDay.forEach((booking) => {
      const dateStr = booking.createdAt.toISOString().split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].bookings++;
      }
    });

    const chartData = Object.values(dailyData);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrganizations,
          totalFacilities,
          totalBookings,
        },
        recent: {
          newUsersWeek,
          newBookingsWeek,
          newUsersMonth,
          newBookingsMonth,
        },
        bookingStatus: {
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          pending: totalBookings - confirmedBookings - cancelledBookings,
        },
        chartData,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
