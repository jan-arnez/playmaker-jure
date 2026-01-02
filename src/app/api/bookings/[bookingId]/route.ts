import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import {
  generateReservationToken,
  generateReservationLink,
  sendWaitlistEmailNotification,
  sendWaitlistSMSNotification,
} from "@/lib/waitlist-notifications";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, status, notes, courtId, startTime, endTime } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 },
      );
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ["confirmed", "cancelled", "completed", "no-show"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    // Validate dates if provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 },
        );
      }
      if (start >= end) {
        return NextResponse.json(
          { error: "Start time must be before end time" },
          { status: 400 },
        );
      }
    }

    // Find the booking and verify user has access to the facility
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        facility: {
          select: {
            id: true,
            organizationId: true,
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

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can manage bookings.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      booking.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Update the booking fields
    const updateData: {
      status?: string;
      updatedAt: Date;
      notes?: string | null;
      courtId?: string | null;
      startTime?: Date;
      endTime?: Date;
    } = {
      updatedAt: new Date(),
    };

    // Check if booking is being cancelled (before update)
    const isBeingCancelled = status === "cancelled" && booking.status !== "cancelled";

    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    if (courtId !== undefined) {
      updateData.courtId = courtId || null;
    }

    if (startTime !== undefined) {
      updateData.startTime = new Date(startTime);
    }

    if (endTime !== undefined) {
      updateData.endTime = new Date(endTime);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    // If booking was cancelled, check for waitlist and notify first person
    if (isBeingCancelled && booking.courtId && booking.startTime && booking.endTime) {
      try {
        // Find the first person in waitlist for this slot
        const waitlistEntry = await prisma.waitlist.findFirst({
          where: {
            courtId: booking.courtId,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: "waitlist",
          },
          orderBy: {
            createdAt: "asc", // First person to join waitlist
          },
        });

        if (waitlistEntry) {
          // Generate reservation token and expiration (30 minutes from now)
          const reservationToken = generateReservationToken();
          const reservationExpiresAt = new Date();
          reservationExpiresAt.setMinutes(reservationExpiresAt.getMinutes() + 30);

          // Update waitlist entry with reservation token
          await prisma.waitlist.update({
            where: { id: waitlistEntry.id },
            data: {
              reservationToken,
              reservationExpiresAt,
              status: "notified",
              notifiedAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // Generate reservation link
          const reservationLink = generateReservationLink(reservationToken);

          // Send email notification
          try {
            await sendWaitlistEmailNotification(
              waitlistEntry.email,
              waitlistEntry.name,
              booking.facility.name,
              booking.court?.name || "Court",
              booking.startTime,
              reservationLink,
            );
          } catch (emailError) {
            console.error("Failed to send waitlist email:", emailError);
            // Continue even if email fails
          }

          // Send SMS notification if phone is provided
          if (waitlistEntry.phone) {
            try {
              await sendWaitlistSMSNotification(
                waitlistEntry.phone,
                booking.facility.name,
                booking.court?.name || "Court",
                booking.startTime,
                reservationLink,
              );
            } catch (smsError) {
              console.error("Failed to send waitlist SMS:", smsError);
              // Continue even if SMS fails
            }
          }
        }
      } catch (waitlistError) {
        // Log error but don't fail the cancellation
        console.error("Error processing waitlist notification:", waitlistError);
      }
    }

    return NextResponse.json(
      {
        message: "Booking status updated successfully",
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
