import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> },
) {
  try {
    const { facilityId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    console.log("Availability API called with:", {
      facilityId,
      startDate,
      endDate,
    });

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      console.log("Facility not found:", facilityId);
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 },
      );
    }

    // Fetch existing bookings for the facility within the date range
    const bookings = await prisma.booking.findMany({
      where: {
        facilityId: facilityId,
        startTime: {
          gte: start,
          lte: end,
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
      },
    });

    // Generate time slots (8 AM to 10 PM)
    const timeSlots = Array.from({ length: 15 }, (_, i) => {
      const hour = 8 + i;
      return `${hour.toString().padStart(2, "0")}:00`;
    });

    // Generate availability for each day
    const availability = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayAvailability = {
        date: currentDate.toISOString().split("T")[0],
        slots: timeSlots.map((time) => {
          const slotDateTime = new Date(currentDate);
          const [hours, minutes] = time.split(":").map(Number);
          slotDateTime.setHours(hours, minutes, 0, 0);

          // Check if this slot is booked
          const booking = bookings.find((booking) => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            return slotDateTime >= bookingStart && slotDateTime < bookingEnd;
          });

          return {
            id: `${currentDate.toISOString().split("T")[0]}-${time}`,
            time,
            available: !booking,
            bookingId: booking?.id,
            userName: booking?.user.name,
          };
        }),
      };

      availability.push(dayAvailability);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}
