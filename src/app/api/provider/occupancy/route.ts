import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const facilityId = searchParams.get("facilityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sport = searchParams.get("sport");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    // Verify user has access to this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Build where clause for bookings
    const whereClause: any = {
      facility: {
        organizationId: organizationId,
      },
      status: {
        not: "cancelled",
      },
    };

    if (facilityId) {
      whereClause.facilityId = facilityId;
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (sport && sport !== "all") {
      whereClause.facility = {
        ...whereClause.facility,
        sport: sport,
      };
    }

    // Fetch bookings with facility data
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            locationType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Fetch facilities for occupancy calculation
    const facilities = await prisma.facility.findMany({
      where: {
        organizationId: organizationId,
        ...(sport && sport !== "all" ? { sport } : {}),
      },
      select: {
        id: true,
        name: true,
        locationType: true,
      },
    });

    // Calculate occupancy data
    const occupancyData = calculateOccupancyData(bookings, facilities);

    return NextResponse.json({
      bookings: bookings.map(booking => ({
        id: booking.id,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        facilityId: booking.facilityId,
        status: booking.status,
        revenue: booking.totalPrice || 0,
        facility: booking.facility,
        user: booking.user,
      })),
      facilities,
      occupancyData,
      summary: {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
        averageOccupancy: occupancyData.averageOccupancy,
        peakHours: occupancyData.peakHours,
      },
    });
  } catch (error) {
    console.error("Error fetching occupancy data:", error);
    return NextResponse.json(
      { error: "Failed to fetch occupancy data" },
      { status: 500 }
    );
  }
}

function calculateOccupancyData(bookings: any[], facilities: any[]) {
  const hourlyData: { [key: string]: { bookings: number; revenue: number } } = {};
  
  // Initialize hourly data
  for (let hour = 0; hour < 24; hour++) {
    for (let day = 0; day < 7; day++) {
      const key = `${day}-${hour}`;
      hourlyData[key] = { bookings: 0, revenue: 0 };
    }
  }

  // Process bookings
  bookings.forEach(booking => {
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const day = startTime.getDay();
    const adjustedDay = day === 0 ? 6 : day - 1; // Convert Sunday=0 to Sunday=6
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    
    // Add booking to each hour it spans
    for (let hour = startHour; hour <= endHour; hour++) {
      if (hour >= 0 && hour < 24 && adjustedDay >= 0 && adjustedDay < 7) {
        const key = `${adjustedDay}-${hour}`;
        hourlyData[key].bookings++;
        hourlyData[key].revenue += booking.totalPrice || 0;
      }
    }
  });

  // Calculate occupancy percentages
  const totalSlotsPerHour = facilities.length * 4; // Assuming 4 slots per hour per facility
  const occupancyGrid: number[][] = [];
  const peakHours: { hour: number; day: number; occupancy: number }[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const row: number[] = [];
    for (let day = 0; day < 7; day++) {
      const key = `${day}-${hour}`;
      const occupancy = totalSlotsPerHour > 0 
        ? Math.min(100, (hourlyData[key].bookings / totalSlotsPerHour) * 100)
        : 0;
      
      row.push(occupancy);
      
      // Track peak hours (occupancy > 70%)
      if (occupancy > 70) {
        peakHours.push({ hour, day, occupancy });
      }
    }
    occupancyGrid.push(row);
  }

  // Calculate average occupancy
  const totalOccupancy = occupancyGrid.flat().reduce((sum, occupancy) => sum + occupancy, 0);
  const averageOccupancy = totalOccupancy / (24 * 7);

  return {
    occupancyGrid,
    averageOccupancy: Math.round(averageOccupancy),
    peakHours: peakHours.sort((a, b) => b.occupancy - a.occupancy).slice(0, 5),
  };
}
