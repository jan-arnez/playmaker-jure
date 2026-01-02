import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courtId } = await params;

    const court = await prisma.court.findUnique({
      where: { id: courtId },
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

    if (!court) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can access courts.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      court.sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(court);
  } catch (error) {
    console.error("Error fetching court:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courtId } = await params;
    const body = await request.json();
    const { name, description, surface, capacity, isActive, timeSlots, locationType, workingHours, pricing } = body;



    // Get court and facility info
    const existingCourt = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        sportCategory: {
          include: {
            facility: {
              select: {
                id: true,
                organizationId: true,
                workingHours: true,
              },
            },
          },
        },
      },
    });

    if (!existingCourt) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can update courts.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      existingCourt.sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Handle workingHours: if provided, use it; if null/undefined, keep existing or use facility default
    let courtWorkingHours = existingCourt.workingHours;
    if (workingHours !== undefined) {
      if (workingHours === null) {
        // Explicitly set to null (use facility default)
        courtWorkingHours = null;
      } else {
        // Use provided working hours
        courtWorkingHours = typeof workingHours === 'string' ? JSON.parse(workingHours) : workingHours;
      }
    }

    // Handle pricing: if provided, use it; if null/undefined, keep existing
    let courtPricing: any = existingCourt.pricing;
    if (pricing !== undefined) {
      if (pricing === null) {
        // Explicitly set to null
        courtPricing = null;
      } else {
        // Use provided pricing
        courtPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
      }
    }

    const updateData: any = {
        name: name || existingCourt.name,
        description: description !== undefined ? description : existingCourt.description,
        surface: surface || existingCourt.surface,
        capacity: capacity ? parseInt(capacity) : existingCourt.capacity,
        isActive: isActive !== undefined ? isActive : existingCourt.isActive,
        timeSlots: timeSlots !== undefined ? timeSlots : existingCourt.timeSlots,
      locationType: locationType || existingCourt.locationType,
    };

    // Only update workingHours if it was explicitly provided
    if (workingHours !== undefined) {
      updateData.workingHours = courtWorkingHours;
    }

    // Only update pricing if it was explicitly provided
    if (pricing !== undefined) {
      updateData.pricing = courtPricing;
    }

    const court = await prisma.court.update({
      where: { id: courtId },
      data: updateData
    });

    return NextResponse.json(court);
  } catch (error) {
    console.error("Error updating court:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courtId } = await params;

    // Get court and facility info
    const existingCourt = await prisma.court.findUnique({
      where: { id: courtId },
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

    if (!existingCourt) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can delete courts.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      existingCourt.sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.court.delete({
      where: { id: courtId }
    });

    return NextResponse.json({ message: "Court deleted successfully" });
  } catch (error) {
    console.error("Error deleting court:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
