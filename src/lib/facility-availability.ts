import { prisma } from "@/lib/prisma";

interface WorkingHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

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

/**
 * Calculate available slots for a facility on a specific date
 */
export async function calculateFacilityAvailability(
  facilityId: string,
  date: Date,
  selectedSport?: string,
  selectedTime?: string
): Promise<{
  slotsAvailableToday?: number;
  slotsForDate?: number;
  slotsForTimeRange?: string[];
}> {
  try {
    // Get facility with courts and working hours
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: {
        id: true,
        workingHours: true,
        sportCategories: {
          where: selectedSport
            ? {
                name: { contains: selectedSport, mode: "insensitive" },
              }
            : undefined,
          select: {
            id: true,
            name: true,
            courts: {
              where: { isActive: true },
              select: {
                id: true,
                workingHours: true,
                timeSlots: true,
              },
            },
          },
        },
      },
    });

    if (!facility) {
      return {};
    }

    const facilityWorkingHours = parseWorkingHours(facility.workingHours);
    const dayName = getDayName(date);
    const dayData = facilityWorkingHours?.[dayName];

    if (!dayData || dayData.closed) {
      return { slotsAvailableToday: 0, slotsForDate: 0 };
    }

    // Parse open and close times
    const [openHour, openMin] = (dayData.open || '08:00').split(':').map(Number);
    const [closeHour, closeMin] = (dayData.close || '22:00').split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    // Handle midnight: "00:00" should be 24:00 (1440 minutes) for end-of-day
    let closeMinutes = closeHour * 60 + closeMin;
    if (closeMinutes === 0) {
      closeMinutes = 24 * 60; // 1440 minutes = midnight
    }
    const totalMinutes = closeMinutes - openMinutes;

    if (totalMinutes <= 0) {
      return { slotsAvailableToday: 0, slotsForDate: 0 };
    }

    // Get all courts for the facility (filtered by sport if selected)
    const allCourts = facility.sportCategories.flatMap(cat => cat.courts);
    
    if (allCourts.length === 0) {
      return { slotsAvailableToday: 0, slotsForDate: 0 };
    }

    // Get court IDs for filtering bookings
    const courtIds = allCourts.map(court => court.id);

    // Get bookings for the date and specific courts
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        facilityId: facilityId,
        courtId: {
          in: courtIds,
        },
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["confirmed", "pending"],
        },
      },
      select: {
        courtId: true,
        startTime: true,
        endTime: true,
      },
    });

    // Group bookings by court
    const bookingsByCourt: { [courtId: string]: Array<{ startTime: Date; endTime: Date }> } = {};
    bookings.forEach(booking => {
      if (!booking.courtId) return;
      if (!bookingsByCourt[booking.courtId]) {
        bookingsByCourt[booking.courtId] = [];
      }
      bookingsByCourt[booking.courtId].push({
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
      });
    });

    // Calculate available slots for each court
    let totalAvailableSlots = 0;
    
    for (const court of allCourts) {
      const courtWorkingHours = parseWorkingHours(court.workingHours);
      const workingHours = courtWorkingHours || facilityWorkingHours;
      const courtDayData = workingHours?.[dayName];

      if (!courtDayData || courtDayData.closed) continue;

      const [courtOpenHour, courtOpenMin] = (courtDayData.open || dayData.open || '08:00').split(':').map(Number);
      const [courtCloseHour, courtCloseMin] = (courtDayData.close || dayData.close || '22:00').split(':').map(Number);

      const courtOpenMinutes = courtOpenHour * 60 + courtOpenMin;
      // Handle midnight: "00:00" should be 24:00 (1440 minutes) for end-of-day
      let courtCloseMinutes = courtCloseHour * 60 + courtCloseMin;
      if (courtCloseMinutes === 0) {
        courtCloseMinutes = 24 * 60; // 1440 minutes = midnight
      }
      const courtTotalMinutes = courtCloseMinutes - courtOpenMinutes;

      if (courtTotalMinutes <= 0) continue;

      // Determine slot duration (default 60 minutes)
      let slotDuration = 60;
      if (court.timeSlots && court.timeSlots.length > 0) {
        const slotDurations = court.timeSlots.map(slot => {
          const match = slot.match(/(\d+)min/);
          return match ? parseInt(match[1]) : 60;
        });
        slotDuration = Math.min(...slotDurations);
      }

      // Generate all possible time slots for this court
      const timeSlots: Date[] = [];
      let currentTime = new Date(date);
      currentTime.setHours(courtOpenHour, courtOpenMin, 0, 0);
      const closeTime = new Date(date);
      closeTime.setHours(courtCloseHour, courtCloseMin, 0, 0);

      while (currentTime < closeTime) {
        const slotEnd = new Date(currentTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
        
        if (slotEnd <= closeTime) {
          timeSlots.push(new Date(currentTime));
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      }

      // Check which slots are available (not booked)
      const courtBookings = bookingsByCourt[court.id] || [];
      let availableSlotsForCourt = 0;

      for (const slot of timeSlots) {
        const slotEnd = new Date(slot);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        // Check if this slot overlaps with any booking
        const isBooked = courtBookings.some(booking => {
          return (
            (slot >= booking.startTime && slot < booking.endTime) ||
            (slotEnd > booking.startTime && slotEnd <= booking.endTime) ||
            (slot <= booking.startTime && slotEnd >= booking.endTime)
          );
        });

        if (!isBooked) {
          availableSlotsForCourt++;
        }
      }

      totalAvailableSlots += availableSlotsForCourt;
    }

    const availableSlotsForDate = totalAvailableSlots;

    // Calculate slots for today - compare dates without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCompare = new Date(date);
    dateToCompare.setHours(0, 0, 0, 0);
    const isToday = dateToCompare.getTime() === today.getTime();
    const slotsAvailableToday = isToday ? availableSlotsForDate : undefined;

    // If time is selected, calculate slots for time range (-2 to +3 hours)
    let slotsForTimeRange: string[] | undefined;
    if (selectedTime && selectedTime !== "any") {
      const timeMatch = selectedTime.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const startHour = Math.max(7, hour - 2);
        const endHour = Math.min(23, hour + 3);
        
        const slots: string[] = [];
        for (let h = startHour; h <= endHour; h++) {
          slots.push(`${h.toString().padStart(2, '0')}:00`);
        }
        slotsForTimeRange = slots;
      } else {
        // Handle time presets
        switch (selectedTime) {
          case "morning":
            slotsForTimeRange = ["07:00", "08:00", "09:00", "10:00", "11:00"];
            break;
          case "afternoon":
            slotsForTimeRange = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
            break;
          case "evening":
            slotsForTimeRange = ["18:00", "19:00", "20:00", "21:00", "22:00"];
            break;
        }
      }
    }

    return {
      slotsAvailableToday,
      slotsForDate: availableSlotsForDate,
      slotsForTimeRange,
    };
  } catch (error) {
    console.error("Error calculating facility availability:", error);
    return {};
  }
}

