import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

/**
 * GET - Get all facilities assigned to a member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { organizationId, memberId } = resolvedParams;

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can view member facilities.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Only platform admins and organization owners can view member facilities" },
        { status: 403 }
      );
    }

    // Verify the member exists and belongs to this organization
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: organizationId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get all facilities assigned to this member
    const facilityMembers = await prisma.facilityMember.findMany({
      where: {
        memberId: memberId,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json({
      facilities: facilityMembers.map((fm) => fm.facility),
    });
  } catch (error) {
    console.error("Error fetching member facilities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Assign facilities to a member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { organizationId, memberId } = resolvedParams;
    const { facilityIds } = await request.json();

    if (!Array.isArray(facilityIds)) {
      return NextResponse.json(
        { error: "facilityIds must be an array" },
        { status: 400 }
      );
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can assign facilities.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Only platform admins and organization owners can assign facilities" },
        { status: 403 }
      );
    }

    // Verify the member exists and belongs to this organization
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: organizationId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Only assign facilities if member role is "member" (receptor)
    if (member.role !== "member") {
      return NextResponse.json(
        { error: "Facilities can only be assigned to members (receptors)" },
        { status: 400 }
      );
    }

    // Verify all facilities belong to this organization
    const facilities = await prisma.facility.findMany({
      where: {
        id: { in: facilityIds },
        organizationId: organizationId,
      },
    });

    if (facilities.length !== facilityIds.length) {
      return NextResponse.json(
        { error: "Some facilities do not belong to this organization" },
        { status: 400 }
      );
    }

    // Remove existing assignments
    await prisma.facilityMember.deleteMany({
      where: {
        memberId: memberId,
      },
    });

    // Create new assignments
    if (facilityIds.length > 0) {
      await prisma.facilityMember.createMany({
        data: facilityIds.map((facilityId: string) => ({
          facilityId,
          memberId: memberId,
        })),
      });
    }

    return NextResponse.json({
      message: "Facilities assigned successfully",
      assignedCount: facilityIds.length,
    });
  } catch (error) {
    console.error("Error assigning facilities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a facility from a member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { organizationId, memberId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");

    if (!facilityId) {
      return NextResponse.json(
        { error: "facilityId is required" },
        { status: 400 }
      );
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can remove facilities.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Only platform admins and organization owners can remove facilities" },
        { status: 403 }
      );
    }

    // Verify the member exists and belongs to this organization
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: organizationId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Remove the facility assignment
    await prisma.facilityMember.deleteMany({
      where: {
        memberId: memberId,
        facilityId: facilityId,
      },
    });

    return NextResponse.json({
      message: "Facility removed successfully",
    });
  } catch (error) {
    console.error("Error removing facility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

