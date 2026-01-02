import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promotionId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { promotionId } = await params;

    const promotion = await prisma.promotion.findFirst({
      where: {
        id: promotionId,
        organization: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
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
          orderBy: {
            usedAt: "desc",
          },
        },
        _count: {
          select: {
            usageRecords: true,
            bookings: true,
          } as any,
        },
      },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate status
    const now = new Date();
    let status = promotion.status;
    if (status === "active" && new Date(promotion.endDate) < now) {
      status = "expired";
    }

    const promo = promotion as any;
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ promotionId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { promotionId } = await params;
    const body = await request.json();

    // Get promotion and organization info
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!existingPromotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    /*
     * SECURITY: Only platform admin (User.role === "admin") or organization owner 
     * (Member.role === "owner") can update promotions.
     * Member.role === "admin" does NOT exist.
     */
    const { canPerformOwnerActions } = await import("@/lib/check-organization-access");
    const canAccess = await canPerformOwnerActions(
      session.user.id,
      existingPromotion.organizationId,
      session.user.role
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

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
      facilityIds,
      sportCategoryIds,
      courtIds,
      firstTimeCustomerOnly,
    } = body;

    // Validate discount value if provided
    if (discountType === "percentage" && discountValue !== undefined) {
      if (discountValue < 0 || discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    if (discountType === "fixed" && discountValue !== undefined) {
      if (discountValue < 0) {
        return NextResponse.json(
          { error: "Fixed discount must be positive" },
          { status: 400 }
        );
      }
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Note: Promotions are automatically applied based on eligibility
    // Priority: If multiple promotions apply, the one with the largest discount (best deal) is used

    // Validate facilities if provided
    if (facilityIds && facilityIds.length > 0) {
      const facilities = await prisma.facility.findMany({
        where: {
          id: { in: facilityIds },
          organizationId: existingPromotion.organizationId,
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
          facility: { organizationId: existingPromotion.organizationId },
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
          sportCategory: { facility: { organizationId: existingPromotion.organizationId } },
        },
      });
      if (courts.length !== courtIds.length) {
        return NextResponse.json(
          { error: "One or more courts not found or access denied" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (status !== undefined) updateData.status = status;
    if (maxUsage !== undefined) updateData.maxUsage = maxUsage || null;
    if (maxUsagePerUser !== undefined)
      updateData.maxUsagePerUser = maxUsagePerUser === 0 ? null : (maxUsagePerUser ?? 1);
    if (timeRestrictions !== undefined)
      updateData.timeRestrictions = timeRestrictions
        ? (timeRestrictions as any)
        : null;
    if (firstTimeCustomerOnly !== undefined)
      updateData.firstTimeCustomerOnly = firstTimeCustomerOnly;

    // Handle facility associations
    if (facilityIds !== undefined) {
      await prisma.promotion.update({
        where: { id: promotionId },
        data: { facilities: { set: [] } },
      });
      if (facilityIds.length > 0) {
        updateData.facilities = {
          connect: facilityIds.map((id: string) => ({ id })),
        };
      }
    }

    // Handle sport category associations
    if (sportCategoryIds !== undefined) {
      await prisma.promotion.update({
        where: { id: promotionId },
        data: { sportCategories: { set: [] } },
      });
      if (sportCategoryIds.length > 0) {
        updateData.sportCategories = {
          connect: sportCategoryIds.map((id: string) => ({ id })),
        };
      }
    }

    // Handle court associations
    if (courtIds !== undefined) {
      await prisma.promotion.update({
        where: { id: promotionId },
        data: { courts: { set: [] } },
      });
      if (courtIds.length > 0) {
        updateData.courts = {
          connect: courtIds.map((id: string) => ({ id })),
        };
      }
    }

    const promotion = await prisma.promotion.update({
      where: { id: promotionId },
      data: updateData,
      include: {
        facilities: true,
        sportCategories: true,
        courts: true,
      },
    });

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
      timeRestrictions: promotion.timeRestrictions
        ? (typeof promotion.timeRestrictions === "string"
            ? JSON.parse(promotion.timeRestrictions)
            : promotion.timeRestrictions)
        : null,
    });
  } catch (error) {
    console.error("Error updating promotion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ promotionId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { promotionId } = await params;

    // Check if user has access to this promotion
    const promotion = await prisma.promotion.findFirst({
      where: {
        id: promotionId,
        organization: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ["owner", "admin"] },
            },
          },
        },
      },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found or access denied" },
        { status: 404 }
      );
    }

    // Check if promotion has been used
    const usageCount = await prisma.promotionUsage.count({
      where: { promotionId },
    });

    if (usageCount > 0) {
      // Instead of deleting, deactivate it
      await prisma.promotion.update({
        where: { id: promotionId },
        data: { status: "inactive" },
      });
      return NextResponse.json({
        message: "Promotion deactivated (cannot delete used promotions)",
        deactivated: true,
      });
    }

    await prisma.promotion.delete({
      where: { id: promotionId },
    });

    return NextResponse.json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

