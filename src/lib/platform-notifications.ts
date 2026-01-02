import { prisma } from "@/lib/prisma";

export type NotificationType = "error" | "warning" | "info" | "action_required";
export type NotificationCategory = 
  | "email" 
  | "cms" 
  | "booking" 
  | "payment" 
  | "system" 
  | "user" 
  | "owner" 
  | "facility";

interface CreateNotificationParams {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Create a platform notification for admin visibility
 * Use this for any platform errors, warnings, or issues that admin should know about
 */
export async function createPlatformNotification({
  type,
  category,
  title,
  message,
  metadata,
}: CreateNotificationParams): Promise<string | null> {
  try {
    const notification = await prisma.platformNotification.create({
      data: {
        type,
        category,
        title,
        message,
        metadata: (metadata || null) as any,
      },
    });
    
    console.log(`[Platform Notification] ${type.toUpperCase()}: ${title}`);
    return notification.id;
  } catch (error) {
    // Don't let notification creation errors break the main flow
    console.error("Failed to create platform notification:", error);
    return null;
  }
}

/**
 * Get unread notification count for admin header badge
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    return await prisma.platformNotification.count({
      where: { isRead: false },
    });
  } catch {
    return 0;
  }
}

/**
 * Get recent notifications for dropdown preview
 */
export async function getRecentNotifications(limit = 5) {
  try {
    return await prisma.platformNotification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    await prisma.platformNotification.update({
      where: { id },
      data: { isRead: true },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Mark notification as resolved
 */
export async function resolveNotification(id: string, adminId: string): Promise<boolean> {
  try {
    await prisma.platformNotification.update({
      where: { id },
      data: { 
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    await prisma.platformNotification.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// Pre-built notification helpers for common scenarios
export const notifications = {
  emailTemplateMissing: (templateKey: string) =>
    createPlatformNotification({
      type: "error",
      category: "email",
      title: "Email Template Missing",
      message: `Template '${templateKey}' not found. Email was not sent.`,
      metadata: { templateKey },
    }),

  emailSendFailed: (templateKey: string, recipientEmail: string, error: string) =>
    createPlatformNotification({
      type: "error",
      category: "email",
      title: "Email Send Failed",
      message: `Failed to send '${templateKey}' to ${recipientEmail}: ${error}`,
      metadata: { templateKey, recipientEmail, error },
    }),

  cmsFallbackUsed: (section: string, reason: string) =>
    createPlatformNotification({
      type: "warning",
      category: "cms",
      title: "CMS Fallback Used",
      message: `${section}: ${reason}. Showing default content.`,
      metadata: { section, reason },
    }),

  bookingConflict: (bookingId: string, details: string) =>
    createPlatformNotification({
      type: "warning",
      category: "booking",
      title: "Booking Conflict Detected",
      message: details,
      metadata: { bookingId },
    }),

  paymentFailed: (bookingId: string, userId: string, error: string) =>
    createPlatformNotification({
      type: "error",
      category: "payment",
      title: "Payment Failed",
      message: `Payment failed for booking ${bookingId}: ${error}`,
      metadata: { bookingId, userId, error },
    }),

  systemError: (component: string, error: string) =>
    createPlatformNotification({
      type: "error",
      category: "system",
      title: `System Error: ${component}`,
      message: error,
      metadata: { component },
    }),

  userIssue: (userId: string, issue: string) =>
    createPlatformNotification({
      type: "warning",
      category: "user",
      title: "User Issue Detected",
      message: issue,
      metadata: { userId },
    }),

  facilityIssue: (facilityId: string, issue: string) =>
    createPlatformNotification({
      type: "warning",
      category: "facility",
      title: "Facility Issue",
      message: issue,
      metadata: { facilityId },
    }),
};
