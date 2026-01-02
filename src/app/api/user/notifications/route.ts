import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsReminders: z.boolean(),
  bookingUpdates: z.boolean(),
  marketingEmails: z.boolean(),
  facilityAlerts: z.boolean().optional(),
  newBookings: z.boolean().optional(),
  gdprConsent: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = notificationSchema.parse(body);

    // Store notification preferences
    // Note: This would typically be stored in a user_preferences table
    // For now, we'll simulate the storage
    const preferences = {
      userId: session.user.id,
      emailNotifications: validatedData.emailNotifications,
      smsReminders: validatedData.smsReminders,
      bookingUpdates: validatedData.bookingUpdates,
      marketingEmails: validatedData.marketingEmails,
      facilityAlerts: validatedData.facilityAlerts || false,
      newBookings: validatedData.newBookings || false,
      gdprConsent: validatedData.gdprConsent,
      updatedAt: new Date(),
    };

    // In a real implementation, you would:
    // 1. Create or update a user_preferences table
    // 2. Store the preferences in the database
    // 3. Integrate with your notification service

    console.log("Notification preferences updated:", preferences);

    return NextResponse.json({
      success: true,
      preferences,
    });

  } catch (error) {
    console.error("Notification update error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
