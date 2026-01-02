import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { canPerformOwnerActions } from "@/lib/check-organization-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sportCategoryId = searchParams.get("sportCategoryId");

    if (!sportCategoryId) {
      return NextResponse.json({ error: "Sport category ID is required" }, { status: 400 });
    }

    // Get sport category and facility info
    const sportCategory = await prisma.sportCategory.findUnique({
      where: { id: sportCategoryId },
      include: {
        facility: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!sportCategory) {
      return NextResponse.json({ error: "Sport category not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can access courts.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const courts = await prisma.court.findMany({
      where: { sportCategoryId },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(courts);
  } catch (error) {
    console.error("Error fetching courts:", error);
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
    const { name, description, surface, capacity, isActive, timeSlots, locationType, sportCategoryId, workingHours, pricing } = body;

    console.log("Court creation request:", { name, sportCategoryId, body });

    if (!name || !sportCategoryId) {
      return NextResponse.json(
        { error: "Name and sport category ID are required" },
        { status: 400 }
      );
    }

    // Get sport category and facility info
    const sportCategory = await prisma.sportCategory.findUnique({
      where: { id: sportCategoryId },
      include: {
        facility: {
          select: {
            id: true,
            organizationId: true,
            workingHours: true,
          },
        },
      },
    });

    if (!sportCategory) {
      return NextResponse.json({ error: "Sport category not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can create courts.
     * Member.role === "admin" does NOT exist.
     */
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      sportCategory.facility.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("Found sport category:", sportCategory);

    // Handle workingHours - Prisma Json field accepts object or null
    let courtWorkingHours: any = null;
    try {
      if (workingHours) {
        // If it's a string, parse it; if object, use as-is
        courtWorkingHours = typeof workingHours === 'string' ? JSON.parse(workingHours) : workingHours;
      } else if (sportCategory.facility.workingHours) {
        // Default to facility working hours
        courtWorkingHours = typeof sportCategory.facility.workingHours === 'string' 
          ? JSON.parse(sportCategory.facility.workingHours as string)
          : sportCategory.facility.workingHours;
      }
    } catch (e) {
      console.error("Error processing workingHours:", e);
      // If there's an error, set to null
      courtWorkingHours = null;
    }

    // Handle capacity - can be number or string, or null/undefined
    let capacityValue: number | null = null;
    if (capacity !== undefined && capacity !== null && capacity !== '') {
      if (typeof capacity === 'number') {
        capacityValue = capacity;
      } else if (typeof capacity === 'string') {
        const parsed = parseInt(capacity, 10);
        if (!isNaN(parsed)) {
          capacityValue = parsed;
        }
      }
    }

    // Prepare data object for Prisma
    const courtData: any = {
      name,
      sportCategoryId,
      isActive: isActive !== undefined ? isActive : true,
      timeSlots: Array.isArray(timeSlots) ? timeSlots : [],
    };

    // Add optional fields
    if (description) courtData.description = description;
    if (surface) courtData.surface = surface;
    if (locationType) courtData.locationType = locationType;
    if (capacityValue !== null) courtData.capacity = capacityValue;
    
    // Prisma Json field - pass object directly, Prisma will handle serialization
    if (courtWorkingHours) {
      courtData.workingHours = courtWorkingHours;
    }

    // Handle pricing - Prisma Json field accepts object or null
    let courtPricing: any = null;
    try {
      if (pricing) {
        // If it's a string, parse it; if object, use as-is
        courtPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
      }
    } catch (e) {
      console.error("Error processing pricing:", e);
      // If there's an error, set to null
      courtPricing = null;
    }

    if (courtPricing) {
      courtData.pricing = courtPricing;
    }

    console.log("Creating court with data:", JSON.stringify(courtData, null, 2));

    let court;
    try {
      court = await prisma.court.create({
        data: courtData
      });
    } catch (createError: any) {
      // If error is about workingHours field not existing, try without it
      if (createError?.message?.includes('workingHours') || createError?.code === 'P2001') {
        console.warn("workingHours field may not exist, retrying without it");
        delete courtData.workingHours;
        court = await prisma.court.create({
          data: courtData
        });
      } else {
        throw createError;
      }
    }

    return NextResponse.json(court, { status: 201 });
  } catch (error) {
    console.error("Error creating court:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      body: body
    });
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: errorMessage,
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}
