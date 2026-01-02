import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 }
      );
    }

    const promotions = await prisma.promotion.findMany({
      where: { organizationId },
      include: {
        facilities: true,
        sportCategories: true,
        courts: true,
        usageRecords: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            booking: {
              include: {
                facility: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            usageRecords: true,
            bookings: true,
          } as any,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform promotions to include calculated status
    const now = new Date();
    const transformedPromotions = promotions.map((promotion) => {
      let status = promotion.status;
      
      // Auto-update status based on dates
      if (status === "active" && new Date(promotion.endDate) < now) {
        status = "expired";
      }

      const promo = promotion as any;
      
      // Calculate usage by day
      const usageByDay: Record<string, number> = {};
      (promo.usageRecords || []).forEach((record: any) => {
        const date = new Date(record.usedAt).toISOString().split("T")[0];
        usageByDay[date] = (usageByDay[date] || 0) + 1;
      });

      return {
        ...promo,
        status,
        discountValue: Number(promo.discountValue),
        usageCount: promo._count?.usageRecords || 0,
        facilities: (promo.facilities || []).map((f: any) => f.id),
        facilityNames: (promo.facilities || []).map((f: any) => f.name),
        sportCategories: (promo.sportCategories || []).map((s: any) => s.id),
        sportCategoryNames: (promo.sportCategories || []).map((s: any) => s.name),
        courts: (promo.courts || []).map((c: any) => c.id),
        courtNames: (promo.courts || []).map((c: any) => c.name),
        timeRestrictions: promo.timeRestrictions
          ? (typeof promo.timeRestrictions === "string"
              ? JSON.parse(promo.timeRestrictions)
              : promo.timeRestrictions)
          : null,
        usageByDay: Object.keys(usageByDay).length > 0 ? usageByDay : undefined,
      };
    });

    return NextResponse.json(transformedPromotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
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
      discountType,
      discountValue,
      startDate,
      endDate,
      status,
      maxUsage,
      maxUsagePerUser,
      timeRestrictions,
      organizationId,
      facilityIds,
      sportCategoryIds,
      courtIds,
      firstTimeCustomerOnly,
    } = body;

    if (
      !name ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !endDate ||
      !organizationId
    ) {
      return NextResponse.json(
        {
          error:
            "Name, discount type, discount value, start date, end date, and organization ID are required",
        },
        { status: 400 }
      );
    }

    // Validate discount value
    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json(
        { error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (discountType === "fixed" && discountValue < 0) {
      return NextResponse.json(
        { error: "Fixed discount must be positive" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can create promotions.
     * Member.role === "admin" does NOT exist.
     */
    const { canPerformOwnerActions } = await import("@/lib/check-organization-access");
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      );
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Note: Promotions are automatically applied based on eligibility
    // Priority: If multiple promotions apply, the one with the largest discount (best deal) is used

    // Validate facilities if provided
    if (facilityIds && facilityIds.length > 0) {
      const facilities = await prisma.facility.findMany({
        where: {
          id: { in: facilityIds },
          organizationId,
        },
      });
      if (facilities.length !== facilityIds.length) {
        return NextResponse.json(
          { error: "One or more facilities not found or access denied" },
          { status: 400 }
        );
      }
    }

    // Validate sport categories if provided
    if (sportCategoryIds && sportCategoryIds.length > 0) {
      const sportCategories = await prisma.sportCategory.findMany({
        where: {
          id: { in: sportCategoryIds },
          facility: { organizationId },
        },
      });
      if (sportCategories.length !== sportCategoryIds.length) {
        return NextResponse.json(
          { error: "One or more sports not found or access denied" },
          { status: 400 }
        );
      }
    }

    // Validate courts if provided
    if (courtIds && courtIds.length > 0) {
      const courts = await prisma.court.findMany({
        where: {
          id: { in: courtIds },
          sportCategory: { facility: { organizationId } },
        },
      });
      if (courts.length !== courtIds.length) {
        return NextResponse.json(
          { error: "One or more courts not found or access denied" },
          { status: 400 }
        );
      }
    }

    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        discountType,
        discountValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || "active",
        maxUsage: maxUsage || null,
        maxUsagePerUser: maxUsagePerUser === 0 ? null : (maxUsagePerUser ?? 1),
        timeRestrictions: timeRestrictions
          ? (timeRestrictions as any)
          : null,
        firstTimeCustomerOnly: (firstTimeCustomerOnly || false) as any,
        organizationId,
        createdBy: session.user.id,
        facilities: facilityIds && facilityIds.length > 0
          ? { connect: facilityIds.map((id: string) => ({ id })) }
          : undefined,
        sportCategories: sportCategoryIds && sportCategoryIds.length > 0
          ? { connect: sportCategoryIds.map((id: string) => ({ id })) }
          : undefined,
        courts: courtIds && courtIds.length > 0
          ? { connect: courtIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        facilities: true,
        sportCategories: true,
        courts: true,
      },
    });

    return NextResponse.json(
      {
        ...promotion,
        discountValue: Number(promotion.discountValue),
        timeRestrictions: promotion.timeRestrictions
          ? (typeof promotion.timeRestrictions === "string"
              ? JSON.parse(promotion.timeRestrictions)
              : promotion.timeRestrictions)
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating promotion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

