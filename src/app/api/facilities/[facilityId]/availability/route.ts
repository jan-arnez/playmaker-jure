import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { checkFacilityAccess } from "@/lib/facility-access";
import { getUserRole } from "@/lib/get-user-role";

// Helper to parse slot duration from timeSlots array (e.g., ["60min"] -> 60)
function parseSlotDuration(timeSlots: string[] | null | undefined): number {
  if (!timeSlots || timeSlots.length === 0) return 60; // Default to 60 minutes
  const match = timeSlots[0].match(/(\d+)min/);
  return match ? parseInt(match[1]) : 60;
}

/**
 * Generate time slots for a specific duration within working hours.
 * 
 * BUSINESS RULE: No slot shall exceed the facility's closing time.
 * This rule is enforced by checking if the slot END time would extend past
 * the closing time. If so, the slot is not generated.
 * 
 * Example: If closing is 22:00 and slot duration is 60 min:
 * - 21:00 slot (ends 22:00) ✓ included
 * - 21:30 slot (ends 22:30) ✗ excluded - would exceed closing
 * 
 * This ensures customers cannot book partially outside working hours.
 * 
 * @param durationMinutes - Duration of each slot in minutes
 * @param startMinutes - Opening time in minutes from midnight (e.g., 630 for 10:30)
 * @param endMinutes - Closing time in minutes from midnight (e.g., 1320 for 22:00)
 * @returns Array of time slots that fit entirely within working hours
 */
function generateTimeSlots(durationMinutes: number, startMinutes = 7 * 60, endMinutes = 24 * 60) {
  const slots: { time: string; duration: number }[] = [];
  let currentMinutes = startMinutes;
  
  while (currentMinutes < endMinutes) {
    // BUSINESS RULE: Check if this slot would extend past closing time
    const slotEndMinutes = currentMinutes + durationMinutes;
    if (slotEndMinutes > endMinutes) {
      // Slot would extend past closing, stop generating
      // This ensures no slot exceeds the facility's working hours
      break;
    }
    
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    
    slots.push({
      time,
      duration: durationMinutes,
    });
    
    currentMinutes += durationMinutes;
  }
  
  return slots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> },
) {
  try {
    // Auth is optional for viewing availability - anyone can see slots
    // Booking details (user names) are only shown to facility staff
    const session = await getServerSession();

    const { facilityId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Support both ?date= (single day) and ?start=&end= (date range)
    const dateParam = searchParams.get("date");
    const startDate = searchParams.get("start") || dateParam;
    const endDate = searchParams.get("end") || dateParam;

    console.log("Availability API called with:", {
      facilityId,
      startDate,
      endDate,
      authenticated: !!session?.user,
    });

    if (!startDate) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    // Get facility with sports categories and courts
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: {
        id: true,
        organizationId: true,
        workingHours: true, // Fetch facility working hours
        sportCategories: {
          select: {
            id: true,
            name: true,
            courts: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                timeSlots: true,
                surface: true,
                locationType: true,
                workingHours: true, // Fetch court working hours
              },
            },
          },
        },
      },
    });

    if (!facility) {
      console.log("Facility not found:", facilityId);
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 },
      );
    }

    // Check if user has staff access to see booking details (user names etc)
    let isStaffMember = false;
    if (session?.user) {
      const member = await prisma.member.findFirst({
        where: {
          userId: session.user.id,
          organizationId: facility.organizationId,
        },
        select: {
          role: true,
        },
      });

      const userRole = getUserRole(session.user, member?.role || null);

      const accessResult = await checkFacilityAccess(
        session.user.id,
        facilityId,
        facility.organizationId,
        userRole
      );

      isStaffMember = accessResult.hasAccess;
    }

    // Flatten courts from all sport categories
    const allCourts = facility.sportCategories.flatMap((category) =>
      category.courts.map((court) => ({
        ...court,
        sportType: category.name,
      }))
    );

    const courtIds = allCourts.map((court) => court.id);

    // Fetch existing bookings for all courts within the date range
    const bookings = await prisma.booking.findMany({
      where: {
        facilityId: facilityId,
        startTime: {
          gte: start,
          lte: new Date(end.getTime() + 24 * 60 * 60 * 1000), // Include end day
        },
        status: {
          in: ["confirmed", "pending"],
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Fetch blocked slots for all courts
    const slotBlocks = await prisma.slotBlock.findMany({
      where: {
        courtId: {
          in: courtIds,
        },
        OR: [
          {
            startTime: {
              gte: start,
              lte: end,
            },
          },
          {
            endTime: {
              gte: start,
              lte: end,
            },
          },
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gte: end } },
            ],
          },
        ],
      },
      select: {
        courtId: true,
        startTime: true,
        endTime: true,
      },
    });

    // Get working date for checking availability
    // Note: We use the start date to check day of week for working hours
    // This assumes the view is typically single day or used for consistent weekly schedule
    // For range views, this might need per-day calculation loop if working hours differ
    const targetDate = start.toISOString().split("T")[0];
    const targetDateObj = new Date(targetDate);
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[targetDateObj.getDay()];

    // Generate per-court availability
    const availability = allCourts.map((court) => {
      // Determine working hours - court hours take priority over facility hours
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const courtHours = court.workingHours as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const facilityHours = facility.workingHours as any;
      const hoursConfig = courtHours || facilityHours;
      
      // Default working hours in minutes from midnight (8:00 = 480, 22:00 = 1320)
      let startMinutes = 8 * 60;  // 8:00 AM
      let endMinutes = 22 * 60;   // 10:00 PM
      let isOpen = true;

      // Parse working hours from config for the specific day
      if (hoursConfig && typeof hoursConfig === 'object') {
        const dayHours = hoursConfig[dayName];
        if (dayHours) {
          // Check if closed today
          if (dayHours.closed === true) {
            isOpen = false;
          } else {
            // Parse open time (e.g., "10:30" -> 630 minutes)
            if (dayHours.open && typeof dayHours.open === 'string') {
              const [openHour, openMin] = dayHours.open.split(':').map(Number);
              if (!isNaN(openHour)) {
                startMinutes = openHour * 60 + (openMin || 0);
              }
            }
            // Parse close time (e.g., "22:00" -> 1320 minutes)
            // Special case: "00:00" means midnight (end of day), treat as 24:00 = 1440 minutes
            if (dayHours.close && typeof dayHours.close === 'string') {
              const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
              if (!isNaN(closeHour)) {
                endMinutes = closeHour * 60 + (closeMin || 0);
                // Handle midnight: "00:00" should be 24:00 (1440 minutes) for end-of-day
                if (endMinutes === 0) {
                  endMinutes = 24 * 60; // 1440 minutes = midnight
                }
              }
            }
          }
        }
      }

      const slotDuration = parseSlotDuration(court.timeSlots);

      // If closed, generate empty slots - otherwise generate within working hours
      // BUSINESS RULE: generateTimeSlots ensures no slot exceeds endMinutes
      const timeSlots = isOpen ? generateTimeSlots(slotDuration, startMinutes, endMinutes) : [];

      const slots = timeSlots.map((slotInfo) => {
        const slotDateTime = new Date(`${targetDate}T${slotInfo.time}:00`);
        const slotEndTime = new Date(slotDateTime.getTime() + slotDuration * 60 * 1000);

        // Check if this slot is booked for THIS court
        const booking = bookings.find((b) => {
          if (b.court?.id !== court.id) return false;
          const bookingStart = new Date(b.startTime);
          const bookingEnd = new Date(b.endTime);
          // Check for any overlap
          return (
            (slotDateTime >= bookingStart && slotDateTime < bookingEnd) ||
            (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
            (slotDateTime <= bookingStart && slotEndTime >= bookingEnd)
          );
        });

        // Check if this slot is blocked for THIS court
        const isBlocked = slotBlocks.some((block) => {
          if (block.courtId !== court.id) return false;
          const blockStart = new Date(block.startTime);
          const blockEnd = new Date(block.endTime);
          return (
            (slotDateTime >= blockStart && slotDateTime < blockEnd) ||
            (slotEndTime > blockStart && slotEndTime <= blockEnd) ||
            (slotDateTime <= blockStart && slotEndTime >= blockEnd)
          );
        });

        return {
          id: `${court.id}-${targetDate}-${slotInfo.time}`,
          time: slotInfo.time,
          duration: slotDuration,
          available: !booking && !isBlocked,
          // Only show booking details to staff members
          bookingId: isStaffMember ? booking?.id : undefined,
          userName: isStaffMember ? booking?.user.name : undefined,
        };
      });

      return {
        courtId: court.id,
        courtName: court.name,
        courtType: court.sportType,
        slotDuration,
        slots,
      };
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}

