import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { checkFacilityAccess } from "@/lib/facility-access";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");

    if (!facilityId) {
      return NextResponse.json({ error: "Facility ID is required" }, { status: 400 });
    }

    // Get facility to check organization
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { organizationId: true }
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    // Get user's role in the organization
    const member = await getMember(session.user.id, facility.organizationId);
    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check facility-specific access
    const accessResult = await checkFacilityAccess(
      session.user.id,
      facilityId,
      facility.organizationId,
      member.role
    );

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.reason || "Access denied" },
        { status: 403 }
      );
    }

    const sportCategories = await prisma.sportCategory.findMany({
      where: { facilityId },
      include: {
        courts: {
          where: { isActive: true },
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(sportCategories);
  } catch (error) {
    console.error("Error fetching sport categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, facilityId } = body;

    if (!name || !type || !facilityId) {
      return NextResponse.json(
        { error: "Name, type, and facility ID are required" },
        { status: 400 }
      );
    }

    // Get facility to check organization
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { organizationId: true }
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can create sport categories.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Only platform admins and organization owners can create sport categories" },
        { status: 403 }
      );
    }

    // Determine user role for facility access check
    const userRole = session.user.role === "admin" 
      ? "admin"  // Platform admin
      : "owner";  // Organization owner (we already verified they're owner)

    // Check facility-specific access
    const accessResult = await checkFacilityAccess(
      session.user.id,
      facilityId,
      facility.organizationId,
      userRole
    );

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.reason || "Access denied" },
        { status: 403 }
      );
    }

    const sportCategory = await prisma.sportCategory.create({
      data: {
        name,
        description,
        type,
        facilityId
      },
      include: {
        courts: true
      }
    });

    return NextResponse.json(sportCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating sport category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
