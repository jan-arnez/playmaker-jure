import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { checkFacilityAccess } from "@/lib/facility-access";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const facility = await prisma.facility.findUnique({
      where: { id: resolvedParams.facilityId },
      include: {
        sportCategories: {
          include: {
            courts: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      }
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
      resolvedParams.facilityId,
      facility.organizationId,
      member.role
    );

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.reason || "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(facility);
  } catch (error) {
    console.error("Error fetching facility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { 
      name, 
      description, 
      address, 
      city, 
      phone, 
      email, 
      website,
      imageUrl, 
      images,
      locationType,
      surface,
      facilities, 
      workingHours,
      rules,
      capacity,
      pricePerHour,
      currency,
      status,
      defaultSeasonStartDate,
      defaultSeasonEndDate
    } = body;

    // First, get the facility to check access
    const existingFacility = await prisma.facility.findUnique({
      where: { id: resolvedParams.facilityId },
      select: { organizationId: true }
    });

    if (!existingFacility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can update facilities.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      existingFacility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Only platform admins and organization owners can update facilities" },
        { status: 403 }
      );
    }

    // Determine user role for facility access check
    const userRole = session.user.role === "admin" 
      ? "admin"  // Platform admin
      : "owner";  // Organization owner (we already verified they're owner via canPerformOwnerActions)

    // Check facility-specific access
    const accessResult = await checkFacilityAccess(
      session.user.id,
      resolvedParams.facilityId,
      existingFacility.organizationId,
      userRole
    );

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.reason || "Access denied" },
        { status: 403 }
      );
    }

    const facility = await prisma.facility.update({
      where: { id: resolvedParams.facilityId },
      data: {
        name,
        description,
        address,
        city,
        phone,
        email,
        website,
        imageUrl,
        // Only update images/facilities if explicitly provided in request (not undefined)
        ...(images !== undefined && { images }),
        locationType,
        surface,
        ...(facilities !== undefined && { facilities }),
        workingHours: workingHours ?? undefined,
        rules,
        capacity,
        pricePerHour,
        currency: currency || "EUR",
        status: status || "active",
        // Season dates for seasonal terms
        ...(defaultSeasonStartDate !== undefined && { 
          defaultSeasonStartDate: defaultSeasonStartDate ? new Date(defaultSeasonStartDate) : null 
        }),
        ...(defaultSeasonEndDate !== undefined && { 
          defaultSeasonEndDate: defaultSeasonEndDate ? new Date(defaultSeasonEndDate) : null 
        }),
        updatedAt: new Date()
      },

      include: {
        sportCategories: {
          include: {
            courts: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    return NextResponse.json(facility);
  } catch (error) {
    console.error("Error updating facility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    // First, get the facility to check access
    const existingFacility = await prisma.facility.findUnique({
      where: { id: resolvedParams.facilityId },
      select: { organizationId: true }
    });

    if (!existingFacility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") can delete facilities.
     * Organization owners cannot delete facilities - this is a platform-level action.
     * Member.role === "admin" does NOT exist.
     */
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only platform admins can delete facilities" },
        { status: 403 }
      );
    }

    await prisma.facility.delete({
      where: { id: resolvedParams.facilityId }
    });

    return NextResponse.json({ message: "Facility deleted successfully" });
  } catch (error) {
    console.error("Error deleting facility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
