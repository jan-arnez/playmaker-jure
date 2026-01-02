import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      slots,
      reason,
      notes,
      isRecurring,
      recurringType,
      recurringEndDate,
    } = body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "At least one slot is required" },
        { status: 400 }
      );
    }

    if (!reason || !["tournament", "maintenance", "lessons", "rain", "other", "rain_override"].includes(reason)) {
      return NextResponse.json(
        { error: "Valid reason is required" },
        { status: 400 }
      );
    }

    // Verify user has access to all courts
    const courtIds = [...new Set(slots.map((slot: any) => slot.courtId))];
    
    const courts = await prisma.court.findMany({
      where: {
        id: { in: courtIds },
      },
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
    });

    if (courts.length !== courtIds.length) {
      return NextResponse.json(
        { error: "One or more courts not found" },
        { status: 404 }
      );
    }

    // Verify access to all organizations
    const organizationIds = [...new Set(courts.map(c => c.sportCategory.facility.organizationId))];
    for (const orgId of organizationIds) {
      const canAccess = await canPerformOwnerActions(
        session.user.id,
        orgId,
        session.user.role
      );
      if (!canAccess) {
        return NextResponse.json(
          { error: "Access denied to one or more courts" },
          { status: 403 }
        );
      }
    }

    const createdBlocks = [];

    // Process each slot
    for (const slot of slots) {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      if (isRecurring && recurringType) {
        // Handle recurring blocks
        const endDate = recurringEndDate ? new Date(recurringEndDate) : null;
        const dayOfWeek = startTime.getDay();

        if (recurringType === "weekly") {
          // Weekly recurrence
          if (!endDate) {
            return NextResponse.json(
              { error: "End date is required for weekly recurrence" },
              { status: 400 }
            );
          }

          let currentDate = new Date(startTime);
          while (currentDate <= endDate) {
            if (currentDate.getDay() === dayOfWeek) {
              const blockStart = new Date(currentDate);
              blockStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
              
              const blockEnd = new Date(currentDate);
              blockEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

              const block = await prisma.slotBlock.create({
                data: {
                  id: generateId(),
                  courtId: slot.courtId,
                  startTime: blockStart,
                  endTime: blockEnd,
                  reason,
                  notes: notes || null,
                  isRecurring: true,
                  recurringType: "weekly",
                  recurringEndDate: endDate,
                  dayOfWeek,
                  createdBy: session.user.id,
                },
              });

              createdBlocks.push(block);
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else if (recurringType === "weekdays") {
          // Every weekday (Monday-Friday)
          const weekdays = [1, 2, 3, 4, 5]; // Monday = 1, Friday = 5
          
          // Start from the first occurrence
          let currentDate = new Date(startTime);
          // Find next weekday if start date is weekend
          while (!weekdays.includes(currentDate.getDay())) {
            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Create blocks for 1 year (or until a reasonable limit)
          const maxDate = new Date(currentDate);
          maxDate.setFullYear(maxDate.getFullYear() + 1);

          while (currentDate <= maxDate) {
            if (weekdays.includes(currentDate.getDay())) {
              const blockStart = new Date(currentDate);
              blockStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
              
              const blockEnd = new Date(currentDate);
              blockEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

              const block = await prisma.slotBlock.create({
                data: {
                  id: generateId(),
                  courtId: slot.courtId,
                  startTime: blockStart,
                  endTime: blockEnd,
                  reason,
                  notes: notes || null,
                  isRecurring: true,
                  recurringType: "weekdays",
                  recurringEndDate: null, // Indefinite for weekdays
                  dayOfWeek: null,
                  createdBy: session.user.id,
                },
              });

              createdBlocks.push(block);
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else if (recurringType === "custom") {
          // Custom recurrence - for now, treat as weekly
          // Can be extended later
          if (!endDate) {
            return NextResponse.json(
              { error: "End date is required for custom recurrence" },
              { status: 400 }
            );
          }

          let currentDate = new Date(startTime);
          while (currentDate <= endDate) {
            if (currentDate.getDay() === dayOfWeek) {
              const blockStart = new Date(currentDate);
              blockStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
              
              const blockEnd = new Date(currentDate);
              blockEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

              const block = await prisma.slotBlock.create({
                data: {
                  id: generateId(),
                  courtId: slot.courtId,
                  startTime: blockStart,
                  endTime: blockEnd,
                  reason,
                  notes: notes || null,
                  isRecurring: true,
                  recurringType: "custom",
                  recurringEndDate: endDate,
                  dayOfWeek,
                  createdBy: session.user.id,
                },
              });

              createdBlocks.push(block);
            }
            currentDate.setDate(currentDate.getDate() + 7);
          }
        }
      } else {
        // Single block (non-recurring)
        const block = await prisma.slotBlock.create({
          data: {
            id: generateId(),
            courtId: slot.courtId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            reason,
            notes: notes || null,
            isRecurring: false,
            recurringType: null,
            recurringEndDate: null,
            dayOfWeek: null,
            createdBy: session.user.id,
          },
        });

        createdBlocks.push(block);
      }
    }

    return NextResponse.json(
      {
        message: `Successfully created ${createdBlocks.length} block(s)`,
        blocks: createdBlocks,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Slot block creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courtId = searchParams.get("courtId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build base where clause (without role filter)
    const where: any = {};

    if (courtId) {
      where.courtId = courtId;
    }

    if (startDate && endDate) {
      where.OR = [
        {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          endTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { startTime: { lte: new Date(startDate) } },
            { endTime: { gte: new Date(endDate) } },
          ],
        },
      ];
    }

    // Get all slot blocks first (without role filter)
    const allBlocks = await prisma.slotBlock.findMany({
      where,
      include: {
        court: {
          include: {
            sportCategory: {
              include: {
                facility: {
                  select: {
                    id: true,
                    organizationId: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Filter blocks based on access control
    const organizationIds = new Set<string>();
    
    // Collect unique organization IDs
    for (const block of allBlocks) {
      const orgId = block.court.sportCategory.facility.organizationId;
      if (orgId) {
        organizationIds.add(orgId);
      }
    }

    // Check access for each organization
    const accessMap = new Map<string, boolean>();
    for (const orgId of organizationIds) {
      const canAccess = await canPerformOwnerActions(
        session.user.id,
        orgId,
        session.user.role
      );
      accessMap.set(orgId, canAccess);
    }

    // Filter blocks based on access
    const accessibleBlocks = allBlocks.filter((block) => {
      const orgId = block.court.sportCategory.facility.organizationId;
      return orgId && accessMap.get(orgId);
    });

    // Transform to include courtId for easier frontend usage
    const transformedBlocks = accessibleBlocks.map((block) => ({
      id: block.id,
      courtId: block.courtId,
      startTime: block.startTime,
      endTime: block.endTime,
      reason: block.reason,
      notes: block.notes,
      isRecurring: block.isRecurring,
      recurringType: block.recurringType,
      recurringEndDate: block.recurringEndDate,
      dayOfWeek: block.dayOfWeek,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    }));

    return NextResponse.json({ blocks: transformedBlocks });
  } catch (error) {
    console.error("Slot block fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "Block IDs are required" },
        { status: 400 }
      );
    }

    const ids = idsParam.split(",").filter((id) => id.trim().length > 0);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "At least one block ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to all blocks
    const blocks = await prisma.slotBlock.findMany({
      where: {
        id: { in: ids },
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

    if (blocks.length !== ids.length) {
      return NextResponse.json(
        { error: "Access denied to one or more blocks" },
        { status: 403 }
      );
    }

    // Delete all blocks
    await prisma.slotBlock.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${ids.length} block(s)`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error("Bulk slot block deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

