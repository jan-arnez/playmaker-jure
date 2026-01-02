import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";
import { KeyMetricsCards } from "@/modules/provider/components/analytics/key-metrics-cards";
import { RevenueAnalytics } from "@/modules/provider/components/analytics/revenue-analytics";
import { BookingAnalytics } from "@/modules/provider/components/analytics/booking-analytics";
import { OccupancyAnalytics } from "@/modules/provider/components/analytics/occupancy-analytics";
import { CustomerInsights } from "@/modules/provider/components/analytics/customer-insights";
import { TimeBasedPatterns } from "@/modules/provider/components/analytics/time-based-patterns";
import { AnalyticsFilters } from "@/modules/provider/components/analytics/analytics-filters";
import { getAccessibleFacilities } from "@/lib/facility-access";
import { NoFacilityAccessMessage } from "@/components/provider/no-facility-access-message";
import { getUserRole } from "@/lib/get-user-role";

interface AnalyticsPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
  searchParams: Promise<{
    dateRange?: string;
    startDate?: string;
    endDate?: string;
    facilityId?: string;
    courtId?: string;
  }>;
}

export default async function AnalyticsPage({ params, searchParams }: AnalyticsPageProps) {
  const session = await getServerSession();
  const locale = await getLocale();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("ProviderModule.analytics");

  // Parse filter params
  const filterDateRange = resolvedSearchParams.dateRange || "all";
  const filterStartDate = resolvedSearchParams.startDate ? new Date(resolvedSearchParams.startDate) : undefined;
  const filterEndDate = resolvedSearchParams.endDate ? new Date(resolvedSearchParams.endDate + "T23:59:59.999") : undefined;
  const filterFacilityId = resolvedSearchParams.facilityId;
  const filterCourtId = resolvedSearchParams.courtId;

  const user = session?.user;

  if (!user) {
    redirect({ href: "/providers/login", locale });
    return;
  }

  /*
   * Platform admin (User.role === "admin") has access to all organizations.
   * Regular users must be members of the organization.
   */
  const isPlatformAdmin = user.role === "admin";
  
  // Get the organization - platform admin can access any, others must be members
  const organization = await prisma.organization.findFirst({
    where: isPlatformAdmin
      ? { slug: resolvedParams.organizationSlug }
      : {
          slug: resolvedParams.organizationSlug,
          members: {
            some: {
              userId: user.id,
            },
          },
        },
    include: {
      members: {
        where: {
          userId: user.id,
        },
        select: {
          role: true,
        },
      },
      facilities: {
        include: {
          bookings: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              court: {
                select: {
                  id: true,
                  name: true,
                  pricing: true,
                },
              },
            },
          },
          sportCategories: {
            include: {
              courts: {
                where: {
                  isActive: true,
                },
                select: {
                  id: true,
                  name: true,
                  pricing: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!organization || !organization.slug) {
    redirect({ href: "/providers/login", locale });
    return;
  }

  // Determine user role: platform admin uses User.role, others use Member.role
  const userRole = getUserRole(user, organization.members[0]?.role);

  // Get accessible facilities based on user role
  const accessibleFacilityIds = await getAccessibleFacilities(
    user.id,
    organization.id,
    userRole
  );

  // If member has no facilities, show no access message (without layout/sidebar)
  if (userRole === "member" && accessibleFacilityIds.length === 0) {
    return <NoFacilityAccessMessage />;
  }

  // Filter facilities to only accessible ones (for dropdown options)
  const accessibleFacilityIdsSet = new Set(accessibleFacilityIds);
  const accessibleFacilities = organization.facilities.filter((facility) =>
    accessibleFacilityIdsSet.has(facility.id)
  );

  // Apply facility filter from URL params for data calculations
  const filteredFacilities = filterFacilityId
    ? accessibleFacilities.filter(f => f.id === filterFacilityId)
    : accessibleFacilities;

  // Calculate real revenue from bookings
  let allBookings = filteredFacilities.flatMap(
    (facility) => facility.bookings
  );

  // Apply date range filter
  if (filterStartDate && filterEndDate) {
    allBookings = allBookings.filter((booking) => {
      const bookingDate = booking.startTime;
      return bookingDate >= filterStartDate && bookingDate <= filterEndDate;
    });
  }

  // Apply court filter
  if (filterCourtId) {
    allBookings = allBookings.filter((booking) => booking.courtId === filterCourtId);
  }

  // Calculate revenue for each booking
  // Priority: court pricing > facility pricePerHour
  const bookingsWithRevenue = allBookings.map((booking) => {
    const facility = filteredFacilities.find(
      (f) => f.id === booking.facilityId
    );
    
    let revenue = 0;
    const durationMs =
      booking.endTime.getTime() - booking.startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationMinutes = durationMs / (1000 * 60);

    // Try to use court pricing first
    if (booking.courtId && booking.court?.pricing) {
      const courtPricing = booking.court.pricing as any;
      
      if (courtPricing.mode === "basic" && courtPricing.basicPrice) {
        // Basic pricing: price per time slot (scales with duration)
        // Find the base slot duration from timeSlots (default to 60min)
        const baseSlotDuration = 60; // Default to 60 minutes
        const pricePerSlot = Number(courtPricing.basicPrice);
        const numberOfSlots = Math.ceil(durationMinutes / baseSlotDuration);
        revenue = pricePerSlot * numberOfSlots;
      } else if (courtPricing.mode === "advanced" && courtPricing.advancedPricing?.tiers) {
        // Advanced pricing: find matching tier based on start time
        const startHour = booking.startTime.getHours();
        const startTimeStr = `${startHour.toString().padStart(2, "0")}:00`;
        
        const matchingTier = courtPricing.advancedPricing.tiers.find((tier: any) => {
          if (!tier.enabled) return false;
          const [tierStart, tierEnd] = tier.timeRange.split("-");
          return startTimeStr >= tierStart && startTimeStr < tierEnd;
        });
        
        if (matchingTier) {
          const baseSlotDuration = 60;
          const pricePerSlot = Number(matchingTier.price);
          const numberOfSlots = Math.ceil(durationMinutes / baseSlotDuration);
          revenue = pricePerSlot * numberOfSlots;
        } else {
          // Fallback to first enabled tier or basic price
          const firstEnabledTier = courtPricing.advancedPricing.tiers.find((t: any) => t.enabled);
          if (firstEnabledTier) {
            const baseSlotDuration = 60;
            const pricePerSlot = Number(firstEnabledTier.price);
            const numberOfSlots = Math.ceil(durationMinutes / baseSlotDuration);
            revenue = pricePerSlot * numberOfSlots;
          } else if (courtPricing.basicPrice) {
            const baseSlotDuration = 60;
            const pricePerSlot = Number(courtPricing.basicPrice);
            const numberOfSlots = Math.ceil(durationMinutes / baseSlotDuration);
            revenue = pricePerSlot * numberOfSlots;
          }
        }
      }
    }
    
    // Fallback to facility pricePerHour if no court pricing
    if (revenue === 0 && facility?.pricePerHour) {
      const pricePerHour = Number(facility.pricePerHour);
      revenue = pricePerHour * durationHours;
    }

    return {
      ...booking,
      revenue,
    };
  });

  // Filter out cancelled bookings for revenue calculations
  const confirmedBookings = bookingsWithRevenue.filter(
    (b) => b.status !== "cancelled"
  );

  // Total revenue (all time)
  const totalRevenue = confirmedBookings.reduce(
    (sum, booking) => sum + booking.revenue,
    0
  );

  // Monthly revenue (current month)
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyBookings = confirmedBookings.filter(
    (booking) => booking.createdAt >= currentMonth
  );
  const monthlyRevenue = monthlyBookings.reduce(
    (sum, booking) => sum + booking.revenue,
    0
  );

  // Last month for growth calculation
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  lastMonth.setDate(1);
  lastMonth.setHours(0, 0, 0, 0);

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const lastMonthBookings = confirmedBookings.filter((booking) => {
    return booking.createdAt >= lastMonth && booking.createdAt < thisMonthStart;
  });
  const lastMonthRevenue = lastMonthBookings.reduce(
    (sum, booking) => sum + booking.revenue,
    0
  );

  // Calculate growth percentages
  const revenueGrowth =
    lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  const bookingGrowth =
    lastMonthBookings.length > 0
      ? ((monthlyBookings.length - lastMonthBookings.length) /
          lastMonthBookings.length) *
        100
      : 0;

  // Total bookings count
  const totalBookings = confirmedBookings.length;

  // Average booking value
  const averageBookingValue =
    totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Calculate occupancy rate
  // Count total active courts across all facilities
  const totalCourts = filteredFacilities.reduce(
    (sum, facility) =>
      sum +
      facility.sportCategories.reduce(
        (catSum, category) => catSum + category.courts.length,
        0
      ),
    0
  );

  // Count active facilities (facilities with at least one booking)
  const activeFacilities = filteredFacilities.filter(
    (f) => f.bookings.length > 0
  ).length;

  // Count active courts (courts with at least one booking)
  const courtsWithBookings = new Set<string>();
  confirmedBookings.forEach((booking) => {
    if (booking.courtId) {
      courtsWithBookings.add(booking.courtId);
    }
  });
  const activeCourts = courtsWithBookings.size;

  // Occupancy rate: percentage of courts that have bookings
  const occupancyRate =
    totalCourts > 0 ? (activeCourts / totalCourts) * 100 : 0;

  // Calculate revenue over time (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyRevenueData: { month: string; revenue: number }[] = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthRevenue = bookingsWithRevenue
      .filter((booking) => {
        const bookingDate = booking.startTime;
        return bookingDate >= date && bookingDate < nextMonth;
      })
      .reduce((sum, booking) => sum + booking.revenue, 0);

    monthlyRevenueData.push({
      month: monthNames[date.getMonth()],
      revenue: monthRevenue,
    });
  }

  // Revenue by facility
  const revenueByFacility = filteredFacilities.map((facility) => {
    const facilityRevenue = bookingsWithRevenue
      .filter((b) => b.facilityId === facility.id)
      .reduce((sum, booking) => sum + booking.revenue, 0);

    return {
      id: facility.id,
      name: facility.name,
      revenue: facilityRevenue,
    };
  });

  // Revenue by court
  const revenueByCourtMap = new Map<string, { name: string; revenue: number }>();
  bookingsWithRevenue.forEach((booking) => {
    if (booking.courtId) {
      const court = filteredFacilities
        .flatMap((f) => f.sportCategories.flatMap((cat) => cat.courts))
        .find((c) => c.id === booking.courtId);

      if (court) {
        const existing = revenueByCourtMap.get(booking.courtId) || {
          name: court.name,
          revenue: 0,
        };
        existing.revenue += booking.revenue;
        revenueByCourtMap.set(booking.courtId, existing);
      }
    }
  });
  const revenueByCourt = Array.from(revenueByCourtMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10 courts

  // Revenue by status
  const revenueByStatus = {
    confirmed: bookingsWithRevenue
      .filter((b) => b.status === "confirmed")
      .reduce((sum, booking) => sum + booking.revenue, 0),
    cancelled: bookingsWithRevenue
      .filter((b) => b.status === "cancelled")
      .reduce((sum, booking) => sum + booking.revenue, 0),
    pending: bookingsWithRevenue
      .filter((b) => b.status === "pending")
      .reduce((sum, booking) => sum + booking.revenue, 0),
    completed: bookingsWithRevenue
      .filter((b) => b.status === "completed")
      .reduce((sum, booking) => sum + booking.revenue, 0),
  };

  // Revenue by day of week
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const revenueByDayOfWeek = dayNames.map((dayName, dayIndex) => {
    const dayRevenue = bookingsWithRevenue
      .filter((booking) => booking.startTime.getDay() === dayIndex)
      .reduce((sum, booking) => sum + booking.revenue, 0);

    return {
      day: dayName,
      revenue: dayRevenue,
    };
  });

  // Revenue by hour of day (bookings that start in each hour)
  const revenueByHour = Array.from({ length: 24 }, (_, hour) => {
    const hourRevenue = bookingsWithRevenue
      .filter((booking) => booking.startTime.getHours() === hour)
      .reduce((sum, booking) => sum + booking.revenue, 0);

    return {
      hour: `${hour.toString().padStart(2, "0")}:00`,
      revenue: hourRevenue,
    };
  });

  const metrics = {
    totalRevenue,
    monthlyRevenue,
    revenueGrowth,
    totalBookings,
    monthlyBookings: monthlyBookings.length,
    bookingGrowth,
    averageBookingValue,
    occupancyRate,
    totalFacilities: filteredFacilities.length,
    activeFacilities,
    totalCourts,
    activeCourts,
  };

  const revenueAnalytics = {
    monthlyRevenueData,
    revenueByFacility: revenueByFacility.sort((a, b) => b.revenue - a.revenue),
    revenueByCourt,
    revenueByStatus,
    revenueByDayOfWeek,
    revenueByHour,
  };

  // Calculate booking analytics
  // Bookings over time (last 6 months)
  const monthlyBookingData: { month: string; bookings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthBookings = allBookings.filter((booking) => {
      const bookingDate = booking.startTime;
      return bookingDate >= date && bookingDate < nextMonth;
    }).length;

    monthlyBookingData.push({
      month: monthNames[date.getMonth()],
      bookings: monthBookings,
    });
  }

  // Booking status breakdown
  const bookingStatusBreakdown = {
    confirmed: allBookings.filter((b) => b.status === "confirmed").length,
    cancelled: allBookings.filter((b) => b.status === "cancelled").length,
    pending: allBookings.filter((b) => b.status === "pending").length,
    completed: allBookings.filter((b) => b.status === "completed").length,
  };

  // Bookings by facility
  const bookingsByFacility = filteredFacilities.map((facility) => ({
    id: facility.id,
    name: facility.name,
    bookings: facility.bookings.length,
  }));

  // Bookings by court
  const bookingsByCourtMap = new Map<
    string,
    { name: string; bookings: number }
  >();
  allBookings.forEach((booking) => {
    if (booking.courtId) {
      const court = filteredFacilities
        .flatMap((f) => f.sportCategories.flatMap((cat) => cat.courts))
        .find((c) => c.id === booking.courtId);

      if (court) {
        const existing = bookingsByCourtMap.get(booking.courtId) || {
          name: court.name,
          bookings: 0,
        };
        existing.bookings += 1;
        bookingsByCourtMap.set(booking.courtId, existing);
      }
    }
  });
  const bookingsByCourt = Array.from(bookingsByCourtMap.values())
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10); // Top 10 courts

  // Bookings by day of week
  const bookingsByDayOfWeek = dayNames.map((dayName, dayIndex) => {
    const dayBookings = allBookings.filter(
      (booking) => booking.startTime.getDay() === dayIndex
    ).length;

    return {
      day: dayName,
      bookings: dayBookings,
    };
  });

  // Bookings by hour of day (bookings that start in each hour)
  const bookingsByHour = Array.from({ length: 24 }, (_, hour) => {
    const hourBookings = allBookings.filter(
      (booking) => booking.startTime.getHours() === hour
    ).length;

    return {
      hour: `${hour.toString().padStart(2, "0")}:00`,
      bookings: hourBookings,
    };
  });

  // Cancellation rate
  const totalBookingsCount = allBookings.length;
  const cancelledBookingsCount = bookingStatusBreakdown.cancelled;
  const cancellationRate =
    totalBookingsCount > 0
      ? (cancelledBookingsCount / totalBookingsCount) * 100
      : 0;

  const bookingAnalytics = {
    monthlyBookingData,
    bookingStatusBreakdown,
    bookingsByFacility: bookingsByFacility.sort(
      (a, b) => b.bookings - a.bookings
    ),
    bookingsByCourt,
    bookingsByDayOfWeek,
    bookingsByHour,
    cancellationRate,
    totalBookings: totalBookingsCount,
    cancelledBookings: cancelledBookingsCount,
  };

  // Calculate occupancy & utilization analytics
  // Court utilization % per facility
  const courtUtilizationByFacility = filteredFacilities.map((facility) => {
    const facilityCourts = facility.sportCategories.flatMap(
      (cat) => cat.courts
    );
    const totalCourtsInFacility = facilityCourts.length;

    // Count courts with bookings
    const courtsWithBookings = new Set<string>();
    confirmedBookings.forEach((booking) => {
      if (
        booking.facilityId === facility.id &&
        booking.courtId &&
        facilityCourts.some((c) => c.id === booking.courtId)
      ) {
        courtsWithBookings.add(booking.courtId);
      }
    });

    const utilizationRate =
      totalCourtsInFacility > 0
        ? (courtsWithBookings.size / totalCourtsInFacility) * 100
        : 0;

    return {
      id: facility.id,
      name: facility.name,
      totalCourts: totalCourtsInFacility,
      activeCourts: courtsWithBookings.size,
      utilizationRate,
    };
  });

  // Peak hours heatmap (day × hour)
  const heatmapData: Array<Array<{ hour: number; day: number; bookings: number; occupancy: number }>> = [];
  for (let hour = 0; hour < 24; hour++) {
    const row: Array<{ hour: number; day: number; bookings: number; occupancy: number }> = [];
    for (let day = 0; day < 7; day++) {
      const hourBookings = confirmedBookings.filter((booking) => {
        const bookingDay = booking.startTime.getDay();
        const adjustedDay = bookingDay === 0 ? 6 : bookingDay - 1;
        const bookingHour = booking.startTime.getHours();
        return adjustedDay === day && bookingHour === hour;
      });

      // Calculate occupancy (bookings / total possible slots)
      // Assuming each facility has multiple courts, estimate slots
      const totalPossibleSlots = totalCourts; // Simplified: one slot per court per hour
      const occupancy =
        totalPossibleSlots > 0
          ? Math.min(100, (hourBookings.length / totalPossibleSlots) * 100)
          : 0;

      row.push({
        hour,
        day,
        bookings: hourBookings.length,
        occupancy,
      });
    }
    heatmapData.push(row);
  }

  // Facility performance comparison
  const facilityPerformance = filteredFacilities.map((facility) => {
    const facilityBookings = confirmedBookings.filter(
      (b) => b.facilityId === facility.id
    );
    const facilityRevenue = facilityBookings.reduce(
      (sum, booking) => sum + booking.revenue,
      0
    );
    const facilityCourts = facility.sportCategories.flatMap(
      (cat) => cat.courts
    );

    // Calculate average bookings per court
    const avgBookingsPerCourt =
      facilityCourts.length > 0
        ? facilityBookings.length / facilityCourts.length
        : 0;

    // Calculate average revenue per court
    const avgRevenuePerCourt =
      facilityCourts.length > 0
        ? facilityRevenue / facilityCourts.length
        : 0;

    return {
      id: facility.id,
      name: facility.name,
      totalBookings: facilityBookings.length,
      totalRevenue: facilityRevenue,
      totalCourts: facilityCourts.length,
      avgBookingsPerCourt,
      avgRevenuePerCourt,
      utilizationRate:
        courtUtilizationByFacility.find((f) => f.id === facility.id)
          ?.utilizationRate || 0,
    };
  });

  // Underutilized courts/facilities
  // Courts with very few bookings compared to total courts
  const allCourtsList = filteredFacilities.flatMap((f) =>
    f.sportCategories.flatMap((cat) => cat.courts)
  );
  
  const underutilizedCourts = allCourtsList
    .map((court) => {
      const courtBookings = bookingsByCourtMap.get(court.id);
      const bookings = courtBookings?.bookings || 0;
      
      // Calculate utilization: if court has less than 5% of average bookings per court, it's underutilized
      const avgBookingsPerCourt = totalBookingsCount / Math.max(1, allCourtsList.length);
      const utilizationPercent = avgBookingsPerCourt > 0 
        ? (bookings / avgBookingsPerCourt) * 100 
        : 0;

      return {
        id: court.id,
        name: court.name,
        bookings,
        utilizationPercent,
        isUnderutilized: utilizationPercent < 50 && bookings < avgBookingsPerCourt * 0.5,
      };
    })
    .filter((court) => court.isUnderutilized)
    .sort((a, b) => a.utilizationPercent - b.utilizationPercent);

  // Underutilized facilities (less than 20% average utilization)
  const underutilizedFacilities = courtUtilizationByFacility
    .filter((facility) => facility.utilizationRate < 20)
    .sort((a, b) => a.utilizationRate - b.utilizationRate);

  const occupancyAnalytics = {
    courtUtilizationByFacility,
    heatmapData,
    facilityPerformance: facilityPerformance.sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    ),
    underutilizedCourts,
    underutilizedFacilities,
  };

  // Calculate customer insights
  // Get all unique customers
  const customerMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      bookings: number;
      revenue: number;
      firstBookingDate: Date;
      lastBookingDate: Date;
    }
  >();

  confirmedBookings.forEach((booking) => {
    const userId = booking.userId;
    const existing = customerMap.get(userId) || {
      id: userId,
      name: booking.user.name || "Unknown",
      email: booking.user.email,
      bookings: 0,
      revenue: 0,
      firstBookingDate: booking.startTime,
      lastBookingDate: booking.startTime,
    };

    existing.bookings += 1;
    existing.revenue += booking.revenue;
    if (booking.startTime < existing.firstBookingDate) {
      existing.firstBookingDate = booking.startTime;
    }
    if (booking.startTime > existing.lastBookingDate) {
      existing.lastBookingDate = booking.startTime;
    }

    customerMap.set(userId, existing);
  });

  const allCustomers = Array.from(customerMap.values());
  const totalUniqueCustomers = allCustomers.length;

  // Repeat customers (customers with more than 1 booking)
  const repeatCustomers = allCustomers.filter((c) => c.bookings > 1);
  const repeatCustomerRate =
    totalUniqueCustomers > 0
      ? (repeatCustomers.length / totalUniqueCustomers) * 100
      : 0;

  // New vs returning customers
  // New customers: first booking in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newCustomers = allCustomers.filter(
    (c) => c.firstBookingDate >= thirtyDaysAgo
  );
  const returningCustomers = allCustomers.filter(
    (c) => c.firstBookingDate < thirtyDaysAgo
  );

  // Top customers by bookings
  const topCustomersByBookings = allCustomers
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      bookings: c.bookings,
      revenue: c.revenue,
    }));

  // Top customers by revenue
  const topCustomersByRevenue = allCustomers
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      bookings: c.bookings,
      revenue: c.revenue,
    }));

  const customerInsights = {
    totalUniqueCustomers,
    repeatCustomerRate,
    repeatCustomersCount: repeatCustomers.length,
    newCustomersCount: newCustomers.length,
    returningCustomersCount: returningCustomers.length,
    topCustomersByBookings,
    topCustomersByRevenue,
  };

  // Calculate time-based patterns
  // Best performing days of week (by revenue and bookings)
  const dayPerformance = dayNames.map((dayName, dayIndex) => {
    const dayBookings = confirmedBookings.filter(
      (booking) => booking.startTime.getDay() === dayIndex
    );
    const dayRevenue = dayBookings.reduce(
      (sum, booking) => sum + booking.revenue,
      0
    );

    return {
      day: dayName,
      bookings: dayBookings.length,
      revenue: dayRevenue,
      avgRevenuePerBooking:
        dayBookings.length > 0 ? dayRevenue / dayBookings.length : 0,
    };
  });

  // Sort by revenue to find best performing days
  const bestPerformingDays = [...dayPerformance]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  // Best performing hours (by revenue and bookings)
  const hourPerformance = Array.from({ length: 24 }, (_, hour) => {
    const hourBookings = confirmedBookings.filter(
      (booking) => booking.startTime.getHours() === hour
    );
    const hourRevenue = hourBookings.reduce(
      (sum, booking) => sum + booking.revenue,
      0
    );

    return {
      hour: hour,
      hourLabel: `${hour.toString().padStart(2, "0")}:00`,
      bookings: hourBookings.length,
      revenue: hourRevenue,
      avgRevenuePerBooking:
        hourBookings.length > 0 ? hourRevenue / hourBookings.length : 0,
    };
  });

  // Sort by revenue to find best performing hours
  const bestPerformingHours = [...hourPerformance]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Seasonal trends - monthly patterns over last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const seasonalTrends: Array<{
    month: string;
    year: number;
    bookings: number;
    revenue: number;
  }> = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthBookings = confirmedBookings.filter((booking) => {
      const bookingDate = booking.startTime;
      return bookingDate >= date && bookingDate < nextMonth;
    });

    const monthRevenue = monthBookings.reduce(
      (sum, booking) => sum + booking.revenue,
      0
    );

    seasonalTrends.push({
      month: monthNames[date.getMonth()],
      year: date.getFullYear(),
      bookings: monthBookings.length,
      revenue: monthRevenue,
    });
  }

  // Check if we have enough data for seasonal trends (at least 3 months)
  const hasSeasonalData = seasonalTrends.filter((t) => t.bookings > 0).length >= 3;

  const timeBasedPatterns = {
    dayPerformance,
    bestPerformingDays,
    hourPerformance,
    bestPerformingHours,
    seasonalTrends,
    hasSeasonalData,
  };

  return (
    <ProviderDashboardLayout
      organization={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
      }}
      userRole={userRole}
    >
      <div className="p-6 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("analytics")}</h1>
          <p className="text-gray-600 mt-1">
            {t("analyticsSubtitle")}
          </p>
        </div>

        <Suspense fallback={<div className="h-16 bg-gray-50 rounded-lg border animate-pulse" />}>
          <AnalyticsFilters
            facilities={accessibleFacilities.map((f) => ({
              id: f.id,
              name: f.name,
            }))}
            courts={accessibleFacilities.flatMap((facility) =>
              facility.sportCategories.flatMap((category) =>
                category.courts.map((court) => ({
                  id: court.id,
                  name: court.name,
                  facilityId: facility.id,
                }))
              )
            )}
            initialFilters={{
              dateRange: resolvedSearchParams.dateRange,
              startDate: resolvedSearchParams.startDate,
              endDate: resolvedSearchParams.endDate,
              facilityId: resolvedSearchParams.facilityId,
              courtId: resolvedSearchParams.courtId,
            }}
          />
        </Suspense>

        <KeyMetricsCards metrics={metrics} />

        <RevenueAnalytics revenueAnalytics={revenueAnalytics} />

        <BookingAnalytics bookingAnalytics={bookingAnalytics} />

        <OccupancyAnalytics 
          organizationId={organization.id}
          organizationSlug={organization.slug}
          facilities={filteredFacilities.map(f => ({
            id: f.id,
            name: f.name,
            sportCategories: f.sportCategories.map(sc => ({
              id: sc.id,
              name: sc.name,
            })),
          }))}
          occupancyAnalytics={occupancyAnalytics} 
        />

        <CustomerInsights customerInsights={customerInsights} />

        <TimeBasedPatterns timeBasedPatterns={timeBasedPatterns} />
      </div>
    </ProviderDashboardLayout>
  );
}
