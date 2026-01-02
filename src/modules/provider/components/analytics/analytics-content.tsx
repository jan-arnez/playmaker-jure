"use client";

import { useState, useMemo } from "react";
import { KeyMetricsCards } from "./key-metrics-cards";
import { RevenueAnalytics } from "./revenue-analytics";
import { BookingAnalytics } from "./booking-analytics";
import { OccupancyAnalytics } from "./occupancy-analytics";
import { CustomerInsights } from "./customer-insights";
import { TimeBasedPatterns } from "./time-based-patterns";
import { AnalyticsFilters } from "./analytics-filters";

interface AnalyticsContentProps {
  facilities: Array<{ id: string; name: string }>;
  courts: Array<{ id: string; name: string; facilityId: string }>;
  organizationId: string;
  organizationSlug: string;
  initialMetrics: any;
  initialRevenueAnalytics: any;
  initialBookingAnalytics: any;
  initialOccupancyAnalytics: any;
  initialCustomerInsights: any;
  initialTimeBasedPatterns: any;
  allBookings: Array<{
    id: string;
    facilityId: string;
    courtId: string | null;
    startTime: Date;
    endTime: Date;
    status: string;
    revenue: number;
    user: { id: string; name: string; email: string };
  }>;
}

export function AnalyticsContent({
  facilities,
  courts,
  organizationId,
  organizationSlug,
  initialMetrics,
  initialRevenueAnalytics,
  initialBookingAnalytics,
  initialOccupancyAnalytics,
  initialCustomerInsights,
  initialTimeBasedPatterns,
  allBookings,
}: AnalyticsContentProps) {
  const [filters, setFilters] = useState<{
    dateRange: "7d" | "30d" | "90d" | "custom" | "all";
    startDate?: Date;
    endDate?: Date;
    facilityId?: string;
    courtId?: string;
  }>({
    dateRange: "all",
  });

  // Filter bookings based on active filters
  const filteredBookings = useMemo(() => {
    let filtered = [...allBookings];

    // Filter by date range
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.startTime);
        return bookingDate >= filters.startDate! && bookingDate <= filters.endDate!;
      });
    }

    // Filter by facility
    if (filters.facilityId) {
      filtered = filtered.filter((booking) => booking.facilityId === filters.facilityId);
    }

    // Filter by court
    if (filters.courtId) {
      filtered = filtered.filter((booking) => booking.courtId === filters.courtId);
    }

    return filtered;
  }, [allBookings, filters]);

  // Recalculate metrics based on filtered bookings
  const metrics = useMemo(() => {
    const confirmedBookings = filteredBookings.filter((b) => b.status !== "cancelled");
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.revenue, 0);
    const totalBookings = confirmedBookings.length;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthlyBookings = confirmedBookings.filter(
      (b) => new Date(b.startTime) >= currentMonth
    );
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + b.revenue, 0);

    // Last month for growth
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const lastMonthBookings = confirmedBookings.filter(
      (b) => new Date(b.startTime) >= lastMonth && new Date(b.startTime) < thisMonthStart
    );
    const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + b.revenue, 0);

    const revenueGrowth =
      lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const bookingGrowth =
      lastMonthBookings.length > 0
        ? ((monthlyBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100
        : 0;

    // Calculate occupancy (simplified - would need facility/court data)
    const uniqueFacilities = new Set(filteredBookings.map((b) => b.facilityId));
    const uniqueCourts = new Set(
      filteredBookings.filter((b) => b.courtId).map((b) => b.courtId!)
    );

    return {
      ...initialMetrics,
      totalRevenue,
      monthlyRevenue,
      revenueGrowth,
      totalBookings,
      monthlyBookings: monthlyBookings.length,
      bookingGrowth,
      averageBookingValue,
      activeFacilities: uniqueFacilities.size,
      activeCourts: uniqueCourts.size,
    };
  }, [filteredBookings, initialMetrics]);

  // For now, we'll use the initial analytics data
  // In a full implementation, we'd recalculate all analytics based on filteredBookings
  // This is a simplified version that shows the filter UI working

  return (
    <div className="space-y-6">
      <AnalyticsFilters
        facilities={facilities}
        courts={courts}
        onFiltersChange={setFilters}
      />

      <KeyMetricsCards metrics={metrics} />

      <RevenueAnalytics revenueAnalytics={initialRevenueAnalytics} />

      <BookingAnalytics bookingAnalytics={initialBookingAnalytics} />

      <OccupancyAnalytics 
        occupancyAnalytics={initialOccupancyAnalytics}
        organizationId={organizationId}
        organizationSlug={organizationSlug}
        facilities={facilities}
      />

      <CustomerInsights customerInsights={initialCustomerInsights} />

      <TimeBasedPatterns timeBasedPatterns={initialTimeBasedPatterns} />
    </div>
  );
}

