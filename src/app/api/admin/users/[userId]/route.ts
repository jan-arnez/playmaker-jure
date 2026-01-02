import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET: Get single user with full details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            facility: { select: { id: true, name: true } },
            court: { select: { id: true, name: true } },
          },
        },
        noShowReports: {
          orderBy: { reportedAt: "desc" },
          include: {
            booking: {
              select: {
                id: true,
                startTime: true,
                facility: { select: { name: true } },
              },
            },
          },
        },
        members: {
          include: {
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
        favorites: {
          include: {
            facility: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            bookings: true,
            waitlistEntries: true,
            noShowReports: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    // Soft delete by banning with permanent reason
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: "Account deactivated by admin",
        banExpires: null, // Permanent
      },
    });

    // TODO: Log to audit log (Phase 4)

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
