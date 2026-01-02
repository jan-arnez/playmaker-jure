import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { getAccessibleFacilities, getMember } from "@/lib/facility-access";
import { canPerformOwnerActions } from "@/lib/check-organization-access";
import { generateFacilitySlug } from "@/lib/generate-slug";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Get user's role in the organization
    const member = await getMember(session.user.id, organizationId);
    if (!member) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    // Get accessible facilities based on user role
    const accessibleFacilityIds = await getAccessibleFacilities(
      session.user.id,
      organizationId,
      member.role
    );

    const facilities = await prisma.facility.findMany({
      where: {
        organizationId,
        id: { in: accessibleFacilityIds },
      },
      include: {
        sportCategories: {
          include: {
            courts: {
              where: { isActive: true },
              orderBy: { name: "asc" }
            }
          },
          orderBy: { name: "asc" }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(facilities);
  } catch (error) {
    console.error("Error fetching facilities:", error);
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
      organizationId 
    } = body;

    if (!name || !address || !city || !organizationId) {
      return NextResponse.json(
        { error: "Name, address, city, and organization ID are required" },
        { status: 400 }
      );
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can create facilities.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Only platform admins and organization owners can create facilities" },
        { status: 403 }
      );
    }

    // Generate unique slug
    const existingSlugs = await prisma.facility.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    }).then(facilities => facilities.map(f => f.slug!).filter(Boolean));

    const slug = generateFacilitySlug(name, existingSlugs);

    const facility = await prisma.facility.create({
      data: {
        name,
        slug,
        description,
        address,
        city,
        phone,
        email,
        website,
        imageUrl,
        images: images || [],
        locationType,
        surface,
        facilities: facilities || [],
        workingHours: workingHours ?? undefined,
        rules,
        capacity,
        pricePerHour,
        currency: currency || "EUR",
        status: status || "active",
        organizationId,
        createdBy: session.user.id
      },
      include: {
        sportCategories: {
          include: {
            courts: true
          }
        }
      }
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error) {
    console.error("Error creating facility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
