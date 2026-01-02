import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

// GET: Fetch notifications with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.platformNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.platformNotification.count({ where }),
      prisma.platformNotification.count({ where: { isRead: false } }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PUT: Update notification (mark as read/resolved)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "ID and action are required" },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "markRead":
        updateData = { isRead: true };
        break;
      case "markUnread":
        updateData = { isRead: false };
        break;
      case "resolve":
        updateData = {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: session.user.id,
        };
        break;
      case "unresolve":
        updateData = {
          isResolved: false,
          resolvedAt: null,
          resolvedBy: null,
        };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const notification = await prisma.platformNotification.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE: Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const deleteResolved = searchParams.get("deleteResolved") === "true";

    if (deleteResolved) {
      // Delete all resolved notifications
      const result = await prisma.platformNotification.deleteMany({
        where: { isResolved: true },
      });
      return NextResponse.json({ 
        success: true, 
        deleted: result.count,
        message: `Deleted ${result.count} resolved notifications` 
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    await prisma.platformNotification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

// POST: Bulk actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (action === "markAllRead") {
      const result = await prisma.platformNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ 
        success: true, 
        updated: result.count,
        message: `Marked ${result.count} notifications as read` 
      });
    }

    if (ids && Array.isArray(ids)) {
      let updateData: Record<string, unknown> = {};
      
      switch (action) {
        case "markRead":
          updateData = { isRead: true };
          break;
        case "resolve":
          updateData = {
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy: session.user.id,
          };
          break;
        case "delete":
          const deleteResult = await prisma.platformNotification.deleteMany({
            where: { id: { in: ids } },
          });
          return NextResponse.json({ 
            success: true, 
            deleted: deleteResult.count 
          });
        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      const result = await prisma.platformNotification.updateMany({
        where: { id: { in: ids } },
        data: updateData,
      });

      return NextResponse.json({ success: true, updated: result.count });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process bulk action:", error);
    return NextResponse.json(
      { error: "Failed to process bulk action" },
      { status: 500 }
    );
  }
}
