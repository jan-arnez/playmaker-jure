import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { checkOrganizationAccess } from "@/lib/check-organization-access";
import { getAccessibleFacilities } from "@/lib/facility-access";
import { getUserRole } from "@/lib/get-user-role";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const promotionId = searchParams.get("promotionId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    /*
     * SECURITY: Check if user has access to this organization
     * Platform admin (User.role === "admin") has access to all organizations
     * Owner (Member.role === "owner") has access to their organization
     * Member (Member.role === "member") has limited access based on facility assignments
     */
    const accessResult = await checkOrganizationAccess(
      session.user.id,
      organizationId,
      session.user.role
    );

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      );
    }

    // Get user role for facility filtering
    const userRole = getUserRole(session.user, accessResult.memberRole || null);

    // Get accessible facilities (for member role filtering)
    const accessibleFacilityIds = await getAccessibleFacilities(
      session.user.id,
      organizationId,
      userRole
    );

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build promotion filter
    const promotionFilter: any = { organizationId };
    if (promotionId) {
      promotionFilter.id = promotionId;
    }

    // Get promotions with usage data
    const allPromotions = await prisma.promotion.findMany({
      where: promotionFilter,
      include: {
        usageRecords: {
          where: dateFilter.startDate || dateFilter.endDate
            ? {
                usedAt: dateFilter,
              }
            : undefined,
          include: {
            booking: {
              include: {
                facility: {
                  select: {
                    id: true,
                    name: true,
                    pricePerHour: true,
                  },
                },
              },
            },
          },
        },
        facilities: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter promotions based on facility access (for member role)
    const accessibleFacilityIdsSet = new Set(accessibleFacilityIds);
    const promotions = allPromotions.filter((promotion) => {
      // Platform admin and owner see all promotions
      if (userRole === "admin" || userRole === "owner") {
        return true;
      }
      
      // Member: only see promotions for accessible facilities
      if (promotion.facilities.length === 0) {
        // Promotion applies to all facilities - member can see it if they have access to any facility
        return accessibleFacilityIds.length > 0;
      }
      
      // Promotion applies to specific facilities - member can see it if they have access to at least one
      return promotion.facilities.some((facility) =>
        accessibleFacilityIdsSet.has(facility.id)
      );
    });

    // Calculate analytics for each promotion
    const analytics = promotions.map((promotion) => {
      const promo = promotion as any;
      
      // Filter usage records based on facility access (for member role)
      let usageRecords = promo.usageRecords || [];
      if (userRole === "member") {
        usageRecords = usageRecords.filter((record: any) => {
          const facilityId = record.booking?.facility?.id;
          return facilityId && accessibleFacilityIdsSet.has(facilityId);
        });
      }
      
      // Calculate total discount amount given
      const totalDiscountGiven = usageRecords.reduce(
        (sum: number, record: any) => sum + Number(record.discountAmount),
        0
      );

      // Calculate estimated revenue impact
      // For percentage discounts, estimate original booking value
      // For fixed discounts, we know the discount amount
      let estimatedRevenueImpact = 0;
      let estimatedBookingsGenerated = 0;

      if (promo.discountType === "percentage") {
        // Estimate: if discount is 20%, original price = discountAmount / (discountValue / 100)
        const avgOriginalPrice = usageRecords.length > 0
          ? totalDiscountGiven / (Number(promo.discountValue) / 100) / usageRecords.length
          : 0;
        estimatedRevenueImpact = usageRecords.reduce((sum: number, record: any) => {
          const booking = record.booking;
          if (booking && booking.facility && booking.facility.pricePerHour) {
            const hours = (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60);
            const originalPrice = Number(booking.facility.pricePerHour) * hours;
            return sum + originalPrice;
          }
          return sum + avgOriginalPrice;
        }, 0);
      } else {
        // For fixed discounts, estimate original price from facility pricing
        estimatedRevenueImpact = usageRecords.reduce((sum: number, record: any) => {
          const booking = record.booking;
          if (booking && booking.facility && booking.facility.pricePerHour) {
            const hours = (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60);
            const originalPrice = Number(booking.facility.pricePerHour) * hours;
            return sum + originalPrice;
          }
          // Fallback: estimate 25 EUR per booking
          return sum + 25;
        }, 0);
      }

      estimatedBookingsGenerated = usageRecords.length;

      // Calculate usage by day
      const usageByDay: Record<string, number> = {};
      usageRecords.forEach((record: any) => {
        const date = new Date(record.usedAt).toISOString().split("T")[0];
        usageByDay[date] = (usageByDay[date] || 0) + 1;
      });

      // Calculate usage by facility
      const usageByFacility: Record<string, { count: number; discount: number }> = {};
      usageRecords.forEach((record: any) => {
        const facilityName = record.booking?.facility?.name || "Unknown";
        if (!usageByFacility[facilityName]) {
          usageByFacility[facilityName] = { count: 0, discount: 0 };
        }
        usageByFacility[facilityName].count += 1;
        usageByFacility[facilityName].discount += Number(record.discountAmount);
      });

      // Calculate conversion rate (if we had views/clicks, but we don't track that yet)
      const conversionRate = null; // Would need to track promotion views

      return {
        promotionId: promo.id,
        promotionName: promo.name,
        totalUsage: usageRecords.length,
        totalDiscountGiven,
        estimatedRevenueImpact,
        estimatedBookingsGenerated,
        averageDiscountPerUse: usageRecords.length > 0
          ? totalDiscountGiven / usageRecords.length
          : 0,
        usageByDay,
        usageByFacility,
        conversionRate,
        facilities: promo.facilities || [],
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        status: promo.status,
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalPromotions: promotions.length,
      totalUsage: analytics.reduce((sum, a) => sum + a.totalUsage, 0),
      totalDiscountGiven: analytics.reduce((sum, a) => sum + a.totalDiscountGiven, 0),
      totalEstimatedRevenue: analytics.reduce((sum, a) => sum + a.estimatedRevenueImpact, 0),
      averageDiscountPerPromotion: analytics.length > 0
        ? analytics.reduce((sum, a) => sum + a.totalDiscountGiven, 0) / analytics.length
        : 0,
      mostUsedPromotion: analytics.length > 0
        ? analytics.reduce((prev, current) =>
            prev.totalUsage > current.totalUsage ? prev : current
          )
        : null,
    };

    return NextResponse.json({
      promotions: analytics,
      overall: overallStats,
    });
  } catch (error) {
    console.error("Error fetching promotion analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

