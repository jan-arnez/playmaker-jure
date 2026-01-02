import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";
import { checkFacilityAccess, getMember } from "@/lib/facility-access";

interface WorkingHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

interface CourtOccupancyData {
  courtId: string;
  courtName: string;
  facilityId: string;
  facilityName: string;
  sportCategoryId: string;
  sportCategoryName: string;
  dailyOccupancy?: {
    date: string;
    occupancy: number;
    bookings: number;
    revenue: number;
    availableSlots: number;
    totalSlots: number;
  }[];
  hourlyOccupancy?: {
    hour: number;
    occupancy: number;
    bookings: number;
    revenue: number;
    availableSlots: number;
    totalSlots: number;
  }[];
}

// Helper to parse working hours
function parseWorkingHours(workingHours: any): WorkingHours | null {
  if (!workingHours) return null;
  if (typeof workingHours === 'string') {
    try {
      return JSON.parse(workingHours);
    } catch {
      return null;
    }
  }
  return workingHours as WorkingHours;
}

// Helper to get day name from date
function getDayName(date: Date): string {
  const dayNames: { [key: number]: string } = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  return dayNames[date.getDay()] || 'monday';
}

// Calculate available slots for a court on a specific day
function calculateAvailableSlots(
  courtWorkingHours: WorkingHours | null,
  facilityWorkingHours: WorkingHours | null,
  timeSlots: string[],
  date: Date
): number {
  // Use court working hours if available, otherwise use facility working hours
  const workingHours = courtWorkingHours || facilityWorkingHours;
  const dayName = getDayName(date);
  const dayData = workingHours?.[dayName];
  
  if (!dayData || dayData.closed) {
    return 0;
  }
  
  // Parse open and close times
  const [openHour, openMin] = (dayData.open || '08:00').split(':').map(Number);
  const [closeHour, closeMin] = (dayData.close || '22:00').split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  const totalMinutes = closeMinutes - openMinutes;
  
  if (totalMinutes <= 0) return 0;
  
  // If no time slots defined, default to 60-minute slots
  if (!timeSlots || timeSlots.length === 0) {
    return Math.floor(totalMinutes / 60);
  }
  
  // Calculate slots based on time slot durations
  // Use the minimum time slot duration to calculate maximum slots
  const slotDurations = timeSlots.map(slot => {
    const match = slot.match(/(\d+)min/);
    return match ? parseInt(match[1]) : 60;
  });
  
  const minSlotDuration = Math.min(...slotDurations);
  return Math.floor(totalMinutes / minSlotDuration);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sportCategoryIds = searchParams.get("sportCategoryIds");
    const facilityId = searchParams.get("facilityId");
    const viewMode = searchParams.get("viewMode") || "days";

    if (!organizationId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Organization ID, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Get user's role in the organization
    const member = await getMember(session.user.id, organizationId);
    if (!member) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    // If facilityId is provided, verify user has access to that facility
    if (facilityId) {
      const accessResult = await checkFacilityAccess(
        session.user.id,
        facilityId,
        organizationId,
        member.role
      );

      if (!accessResult.hasAccess) {
        return NextResponse.json(
          { error: accessResult.reason || "Access denied to this facility" },
          { status: 403 }
        );
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build where clause for courts
    const courtWhere: any = {
      sportCategory: {
        facility: {
          organizationId: organizationId,
        },
      },
      isActive: true,
    };

    if (facilityId) {
      courtWhere.sportCategory.facility.id = facilityId;
    } else {
      // If no facilityId specified, filter to only accessible facilities for members
      if (member.role === "member") {
        const { getAccessibleFacilities } = await import("@/lib/facility-access");
        const accessibleFacilityIds = await getAccessibleFacilities(
          session.user.id,
          organizationId,
          member.role
        );
        if (accessibleFacilityIds.length > 0) {
          courtWhere.sportCategory.facility.id = { in: accessibleFacilityIds };
        } else {
          // Member has no accessible facilities
          return NextResponse.json({ data: [] });
        }
      }
    }

    // Parse sport category IDs filter
    let sportCategoryIdsArray: string[] = [];
    if (sportCategoryIds && sportCategoryIds !== 'all' && sportCategoryIds.trim() !== '') {
      sportCategoryIdsArray = sportCategoryIds.split(',').filter(id => id.trim() !== '');
      if (sportCategoryIdsArray.length > 0) {
        courtWhere.sportCategoryId = {
          in: sportCategoryIdsArray,
        };
      }
    }

    // Fetch courts with their sport categories and facilities
    const courts = await prisma.court.findMany({
      where: courtWhere,
      include: {
        sportCategory: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                workingHours: true,
              },
            },
          },
        },
      },
      orderBy: [
        { sportCategory: { facility: { name: 'asc' } } },
        { sportCategory: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Fetch bookings for the date range
    const bookings = await prisma.booking.findMany({
      where: {
        courtId: {
          in: courts.map(c => c.id),
        },
        startTime: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['confirmed', 'pending'],
        },
      },
      select: {
        id: true,
        courtId: true,
        startTime: true,
        endTime: true,
      },
    });

    // Group bookings by court and date/hour based on view mode
    const bookingsByCourtAndDate: { [key: string]: { [key: string]: any[] } } = {};
    const bookingsByCourtAndHour: { [key: string]: { [key: number]: any[] } } = {};
    
    bookings.forEach(booking => {
      // Skip bookings without a court
      if (!booking.courtId) return;
      
      const bookingDate = new Date(booking.startTime).toISOString().split('T')[0];
      const bookingHour = new Date(booking.startTime).getHours();
      const bookingEndHour = new Date(booking.endTime).getHours();
      
      // Group by date (for daily view)
      if (!bookingsByCourtAndDate[booking.courtId]) {
        bookingsByCourtAndDate[booking.courtId] = {};
      }
      if (!bookingsByCourtAndDate[booking.courtId][bookingDate]) {
        bookingsByCourtAndDate[booking.courtId][bookingDate] = [];
      }
      bookingsByCourtAndDate[booking.courtId][bookingDate].push(booking);
      
      // Group by hour (for hourly view) - count booking in each hour it spans
      if (!bookingsByCourtAndHour[booking.courtId]) {
        bookingsByCourtAndHour[booking.courtId] = {};
      }
      for (let hour = bookingHour; hour <= bookingEndHour && hour < 24; hour++) {
        if (!bookingsByCourtAndHour[booking.courtId][hour]) {
          bookingsByCourtAndHour[booking.courtId][hour] = [];
        }
        bookingsByCourtAndHour[booking.courtId][hour].push(booking);
      }
    });

    // Calculate occupancy for each court
    const result: CourtOccupancyData[] = [];

    for (const court of courts) {
      const courtWorkingHours = parseWorkingHours(court.workingHours);
      const facilityWorkingHours = parseWorkingHours(court.sportCategory.facility.workingHours);
      
      if (viewMode === "hours") {
        // Calculate hourly occupancy (aggregated across all days in range)
        const hourlyOccupancy: CourtOccupancyData['hourlyOccupancy'] = [];
        
        // Calculate total available slots per hour across all days
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const hourlyAvailableSlots: { [hour: number]: number } = {};
        
        // Calculate available slots for each hour across all days
        for (let hour = 0; hour < 24; hour++) {
          let totalSlotsForHour = 0;
          const currentDate = new Date(start);
          
          while (currentDate <= end) {
            const dayName = getDayName(currentDate);
            const workingHours = courtWorkingHours || facilityWorkingHours;
            const dayData = workingHours?.[dayName];
            
            if (dayData && !dayData.closed) {
              const [openHour] = (dayData.open || '08:00').split(':').map(Number);
              const [closeHour] = (dayData.close || '22:00').split(':').map(Number);
              
              // If hour is within working hours, count it
              if (hour >= openHour && hour < closeHour) {
                // Calculate slots for this hour (simplified: 1 slot per hour)
                totalSlotsForHour += 1;
              }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          hourlyAvailableSlots[hour] = totalSlotsForHour;
        }
        
        // Calculate occupancy for each hour
        for (let hour = 0; hour < 24; hour++) {
          const hourBookings = bookingsByCourtAndHour[court.id]?.[hour] || [];
          const bookingsCount = hourBookings.length;
          const revenue = hourBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
          const availableSlots = hourlyAvailableSlots[hour] || 0;
          
          // Calculate occupancy percentage
          const occupancy = availableSlots > 0 
            ? Math.min(100, (bookingsCount / availableSlots) * 100)
            : 0;

          hourlyOccupancy.push({
            hour,
            occupancy: Math.round(occupancy * 100) / 100,
            bookings: bookingsCount,
            revenue,
            availableSlots,
            totalSlots: availableSlots,
          });
        }

        result.push({
          courtId: court.id,
          courtName: court.name,
          facilityId: court.sportCategory.facility.id,
          facilityName: court.sportCategory.facility.name,
          sportCategoryId: court.sportCategory.id,
          sportCategoryName: court.sportCategory.name,
          hourlyOccupancy,
        });
      } else {
        // Calculate daily occupancy (existing logic)
        const dailyOccupancy: CourtOccupancyData['dailyOccupancy'] = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const availableSlots = calculateAvailableSlots(
            courtWorkingHours,
            facilityWorkingHours,
            court.timeSlots,
            currentDate
          );

          const dayBookings = bookingsByCourtAndDate[court.id]?.[dateStr] || [];
          const bookingsCount = dayBookings.length;
          const revenue = dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
          
          // Calculate occupancy percentage
          const occupancy = availableSlots > 0 
            ? Math.min(100, (bookingsCount / availableSlots) * 100)
            : 0;

          dailyOccupancy.push({
            date: dateStr,
            occupancy: Math.round(occupancy * 100) / 100, // Round to 2 decimal places
            bookings: bookingsCount,
            revenue,
            availableSlots,
            totalSlots: availableSlots,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        result.push({
          courtId: court.id,
          courtName: court.name,
          facilityId: court.sportCategory.facility.id,
          facilityName: court.sportCategory.facility.name,
          sportCategoryId: court.sportCategory.id,
          sportCategoryName: court.sportCategory.name,
          dailyOccupancy,
        });
      }
    }

    return NextResponse.json({ courts: result });
  } catch (error) {
    console.error("Error fetching court occupancy data:", error);
    return NextResponse.json(
      { error: "Failed to fetch court occupancy data" },
      { status: 500 }
    );
  }
}

