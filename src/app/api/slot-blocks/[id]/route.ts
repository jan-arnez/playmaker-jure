import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the block and verify user has access
    const block = await prisma.slotBlock.findFirst({
      where: {
        id,
        court: {
          sportCategory: {
            facility: {
              organization: {
                members: {
                  some: {
                    userId: session.user.id,
                    role: { in: ["owner", "admin"] },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!block) {
      return NextResponse.json(
        { error: "Slot block not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the block
    await prisma.slotBlock.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Slot block deleted successfully",
    });
  } catch (error) {
    console.error("Slot block deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason, notes, startTime, endTime } = body;

    // Get block and facility info
    const block = await prisma.slotBlock.findUnique({
      where: { id },
      include: {
        court: {
          include: {
            sportCategory: {
              include: {
                facility: {
                  select: {
                    id: true,
                    organizationId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!block) {
      return NextResponse.json({ error: "Slot block not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can update slot blocks.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      block.court.sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate reason if provided
    if (reason !== undefined) {
      const validReasons = ["tournament", "maintenance", "lessons", "rain", "other", "rain_override"];
      if (!validReasons.includes(reason)) {
        return NextResponse.json(
          { error: "Invalid reason" },
          { status: 400 }
        );
      }
    }

    // Validate dates if provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
      if (start >= end) {
        return NextResponse.json(
          { error: "Start time must be before end time" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      reason?: string;
      notes?: string | null;
      startTime?: Date;
      endTime?: Date;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (reason !== undefined) {
      updateData.reason = reason;
    }

    if (notes !== undefined) {
      updateData.notes = notes.trim() || null;
    }

    if (startTime !== undefined) {
      updateData.startTime = new Date(startTime);
    }

    if (endTime !== undefined) {
      updateData.endTime = new Date(endTime);
    }

    // Update the block
    const updatedBlock = await prisma.slotBlock.update({
      where: { id },
      data: updateData,
      include: {
        court: {
          include: {
            sportCategory: {
              include: {
                facility: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Slot block updated successfully",
      block: {
        id: updatedBlock.id,
        courtId: updatedBlock.courtId,
        startTime: updatedBlock.startTime,
        endTime: updatedBlock.endTime,
        reason: updatedBlock.reason,
        notes: updatedBlock.notes,
        isRecurring: updatedBlock.isRecurring,
        recurringType: updatedBlock.recurringType,
        recurringEndDate: updatedBlock.recurringEndDate,
        dayOfWeek: updatedBlock.dayOfWeek,
        createdAt: updatedBlock.createdAt,
        updatedAt: updatedBlock.updatedAt,
      },
    });
  } catch (error) {
    console.error("Slot block update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

