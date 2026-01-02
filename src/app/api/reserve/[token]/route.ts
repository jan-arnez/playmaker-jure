import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "node:crypto";
import {
  generateReservationToken,
  generateReservationLink,
  sendWaitlistEmailNotification,
  sendWaitlistSMSNotification,
} from "@/lib/waitlist-notifications";

// Generate a random ID similar to Better Auth format
function generateId(): string {
  return randomBytes(16).toString("base64url");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Reservation token is required" },
        { status: 400 },
      );
    }

    // Find waitlist entry by reservation token
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { reservationToken: token },
      include: {
        facility: {
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!waitlistEntry) {
      return NextResponse.json(
        { error: "Invalid reservation token" },
        { status: 404 },
      );
    }

    // Check if already booked
    if (waitlistEntry.status === "booked") {
      return NextResponse.json(
        {
          error: "This reservation has already been booked",
          bookingId: waitlistEntry.id,
        },
        { status: 409 },
      );
    }

    // Check if expired
    const now = new Date();
    if (
      waitlistEntry.reservationExpiresAt &&
      now > waitlistEntry.reservationExpiresAt
    ) {
      // Mark as expired
      await prisma.waitlist.update({
        where: { id: waitlistEntry.id },
        data: {
          status: "expired",
          updatedAt: new Date(),
        },
      });

      // Find next person in waitlist and notify them
      const nextWaitlistEntry = await prisma.waitlist.findFirst({
        where: {
          courtId: waitlistEntry.courtId,
          startTime: waitlistEntry.startTime,
          endTime: waitlistEntry.endTime,
          status: "waitlist",
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (nextWaitlistEntry) {
        // Generate new reservation token for next person
        const newReservationToken = generateReservationToken();
        const reservationExpiresAt = new Date();
        reservationExpiresAt.setMinutes(reservationExpiresAt.getMinutes() + 30);

        await prisma.waitlist.update({
          where: { id: nextWaitlistEntry.id },
          data: {
            reservationToken: newReservationToken,
            reservationExpiresAt,
            status: "notified",
            notifiedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        const reservationLink = generateReservationLink(newReservationToken);

        // Send notifications to next person
        try {
          await sendWaitlistEmailNotification(
            nextWaitlistEntry.email,
            nextWaitlistEntry.name,
            waitlistEntry.facility.name,
            waitlistEntry.court.name,
            nextWaitlistEntry.startTime,
            reservationLink,
          );
        } catch (emailError) {
          console.error("Failed to send email to next waitlist person:", emailError);
        }

        if (nextWaitlistEntry.phone) {
          try {
            await sendWaitlistSMSNotification(
              nextWaitlistEntry.phone,
              waitlistEntry.facility.name,
              waitlistEntry.court.name,
              nextWaitlistEntry.startTime,
              reservationLink,
            );
          } catch (smsError) {
            console.error("Failed to send SMS to next waitlist person:", smsError);
          }
        }
      }

      return NextResponse.json(
        { error: "Reservation link has expired" },
        { status: 410 },
      );
    }

    // Check if slot is still available (no conflicts)
    const conflicts = await prisma.booking.findMany({
      where: {
        courtId: waitlistEntry.courtId,
        status: {
          in: ["confirmed", "pending"],
        },
        OR: [
          {
            startTime: {
              lt: waitlistEntry.endTime,
            },
            endTime: {
              gt: waitlistEntry.startTime,
            },
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      // Slot is no longer available
      await prisma.waitlist.update({
        where: { id: waitlistEntry.id },
        data: {
          status: "expired",
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: "This slot is no longer available" },
        { status: 409 },
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        id: generateId(),
        facilityId: waitlistEntry.facilityId,
        courtId: waitlistEntry.courtId,
        userId: waitlistEntry.userId,
        startTime: waitlistEntry.startTime,
        endTime: waitlistEntry.endTime,
        status: "confirmed",
        notes: `Auto-booked from waitlist`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        facility: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Update waitlist entry status to booked
    await prisma.waitlist.update({
      where: { id: waitlistEntry.id },
      data: {
        status: "booked",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Booking confirmed successfully",
        booking: {
          id: booking.id,
          facilityName: booking.facility.name,
          courtName: booking.court?.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reservation processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

