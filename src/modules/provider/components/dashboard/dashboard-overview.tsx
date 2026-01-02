"use client";

import { Building2, Calendar, Plus, TrendingUp, AlertCircle, Users, Euro, Clock, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProviderContext } from "@/context/provider-context";
import { useEffect, useState } from "react";
import { useOptimisticDashboard } from "@/hooks/use-optimistic-dashboard";

// Import new components
import { RealTimeBookingWidget } from "./real-time-booking-widget";
import { FacilitiesGrid } from "./facilities-grid";
import { PendingActionsWidget } from "./pending-actions-widget";
import { QuickRevenueSnapshot } from "./quick-revenue-snapshot";
import { UpcomingBookingsList } from "./upcoming-bookings-list";
import { CompactStatCard, StatCardPresets } from "./compact-stat-card";
import { CourtOccupancyHeatmap } from "./court-occupancy-heatmap";

interface DashboardOverviewProps {
  stats?: {
    totalFacilities: number;
    totalBookings: number;
    activeBookings: number;
    teamMembers: number;
    monthlyRevenue: number;
    pendingBookings: number;
    occupancyRate?: number;
    averageRating?: number;
    todayBookings?: number;
    weeklyRevenue?: number;
    lastWeekRevenue?: number;
    lastMonthRevenue?: number;
  };
  bookings?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    facilityId: string;
    facilityName: string;
    courtName?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    status: "confirmed" | "pending" | "cancelled" | "completed";
    revenue?: number;
    totalAmount?: number;
    notes?: string;
    createdAt: string;
  }>;
  facilities?: Array<{
    id: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    imageUrl?: string;
    status: "active" | "inactive" | "maintenance";
    todayBookings: number;
    totalBookings: number;
    occupancyRate: number;
    sportCategories: Array<{
      id: string;
      name: string;
      courts: Array<{
        id: string;
        name: string;
        isActive: boolean;
      }>;
    }>;
  }>;
  pendingActions?: Array<{
    id: string;
    type: "booking" | "promotion" | "maintenance" | "notification";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    createdAt: Date;
    dueDate?: Date;
    facilityName?: string;
    customerName?: string;
    amount?: number;
    actionRequired: boolean;
  }>;
  onCreateFacility?: () => void;
  onViewFacility?: (facilityId: string) => void;
  onManageFacility?: (facilityId: string) => void;
  onAddBooking?: (facilityId: string) => void;
  onViewBooking?: (bookingId: string) => void;
  onContactCustomer?: (email: string, phone?: string) => void;
  onConfirmBooking?: (bookingId: string) => void;
  onCancelBooking?: (bookingId: string) => void;
  onViewAllBookings?: () => void;
  onViewAllActions?: () => void;
  onViewAnalytics?: () => void;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function DashboardOverview({
  stats = {
    totalFacilities: 0,
    totalBookings: 0,
    activeBookings: 0,
    teamMembers: 1,
    monthlyRevenue: 0,
    pendingBookings: 0,
    occupancyRate: 0,
    averageRating: 0,
    todayBookings: 0,
    weeklyRevenue: 0,
    lastWeekRevenue: 0,
    lastMonthRevenue: 0,
  },
  bookings = [],
  facilities = [],
  pendingActions = [],
  onCreateFacility,
  onViewFacility,
  onManageFacility,
  onAddBooking,
  onViewBooking,
  onContactCustomer,
  onConfirmBooking,
  onCancelBooking,
  onViewAllBookings,
  onViewAllActions,
  onViewAnalytics,
}: DashboardOverviewProps) {
  const t = useTranslations("ProviderModule.dashboard");
  const { organization, userRole } = useProviderContext();

  const canCreateFacility = userRole === "owner" || userRole === "admin";

  // Optimistic dashboard data
  const {
    data: dashboardData,
    stats: currentStats,
    alerts,
    lastRefresh,
    isRefreshing,
    updateStats,
    addAlert,
    removeAlert,
    refreshData,
    hasOptimisticUpdates,
    hasFailedUpdates,
    clearErrors
  } = useOptimisticDashboard({
    stats: {
      id: 'dashboard-stats',
      ...stats,
      lastUpdated: new Date().toISOString(),
    },
    alerts: []
  }, {
    onStatsUpdate: (newStats) => {
      console.log('Stats updated:', newStats);
    },
    onAlertUpdate: (newAlerts) => {
      console.log('Alerts updated:', newAlerts);
    }
  });

  // Separate current and upcoming bookings
  const now = new Date();
  const currentBookings = bookings.filter(booking => {
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    return startTime <= now && endTime >= now && booking.status === "confirmed";
  }).map(booking => ({
    ...booking,
    isCurrent: true,
  }));

  const upcomingBookings = bookings.filter(booking => {
    const startTime = new Date(booking.startTime);
    const timeUntil = startTime.getTime() - now.getTime();
    return startTime > now && timeUntil <= 2 * 60 * 60 * 1000 && booking.status === "confirmed"; // Next 2 hours
  });

  // Calculate trends
  const weeklyTrend = currentStats.lastWeekRevenue ? 
    (((currentStats.weeklyRevenue ?? 0) - currentStats.lastWeekRevenue) / currentStats.lastWeekRevenue * 100) : 0;
  
  const monthlyTrend = currentStats.lastMonthRevenue ? 
    ((currentStats.monthlyRevenue - currentStats.lastMonthRevenue) / currentStats.lastMonthRevenue * 100) : 0;

  const occupancyTrend = (currentStats.occupancyRate ?? 0) > 0 ? 5 : 0; // Mock trend

  // Compact stat cards data
  const compactStats = [
    {
      title: "Monthly Revenue",
      value: `€${currentStats.monthlyRevenue.toLocaleString()}`,
      description: "This month",
      icon: Euro,
      trend: {
        value: Math.abs(monthlyTrend),
        direction: (monthlyTrend >= 0 ? "up" : "down") as "up" | "down",
        period: "last month"
      },
      ...StatCardPresets.revenue,
    },
    {
      title: "Today's Bookings",
      value: currentStats.todayBookings || 0,
      description: "Scheduled today",
      icon: Calendar,
      trend: {
        value: 12,
        direction: "up" as const,
        period: "yesterday"
      },
      ...StatCardPresets.bookings,
    },
    {
      title: "Occupancy Rate",
      value: `${currentStats.occupancyRate ?? 0}%`,
      description: "Average utilization",
      icon: TrendingUp,
      trend: {
        value: Math.abs(occupancyTrend),
        direction: (occupancyTrend >= 0 ? "up" : "down") as "up" | "down",
        period: "last week"
      },
      ...StatCardPresets.occupancy,
    },
    {
      title: "Active Now",
      value: currentBookings.length,
      description: "Currently in use",
      icon: CheckCircle,
      ...StatCardPresets.active,
    },
    {
      title: "Pending Actions",
      value: pendingActions.length,
      description: "Require attention",
      icon: AlertCircle,
      badge: pendingActions.length > 0 ? {
        text: "Action needed",
        variant: "destructive" as const
      } : undefined,
      ...StatCardPresets.pending,
    },
    {
      title: "Team Members",
      value: currentStats.teamMembers,
      description: "Active staff",
      icon: Users,
      ...StatCardPresets.team,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {organization.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Your revenue engine hub • Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Loading...'}
            {hasOptimisticUpdates && (
              <span className="ml-2 text-blue-600 text-sm">• Optimistic updates active</span>
            )}
            {hasFailedUpdates && (
              <span className="ml-2 text-red-600 text-sm">• Some updates failed</span>
            )}
          </p>
        </div>
        {canCreateFacility && onCreateFacility && (
          <Button onClick={onCreateFacility} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Facility
          </Button>
        )}
      </div>


      {/* Compact Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {compactStats.map((stat) => (
          <CompactStatCard
            key={stat.title}
            {...stat}
            onClick={stat.title === "Pending Actions" ? onViewAllActions : undefined}
          />
        ))}
      </div>

      {/* Facilities Grid */}
      <FacilitiesGrid
        facilities={facilities}
        onViewFacility={onViewFacility}
        onManageFacility={onManageFacility}
        onAddBooking={onAddBooking}
        onCreateFacility={onCreateFacility}
        canManageFacilities={canCreateFacility}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Real-Time Bookings */}
          <RealTimeBookingWidget
            currentBookings={currentBookings}
            upcomingBookings={upcomingBookings}
            onViewBooking={onViewBooking}
            onContactCustomer={onContactCustomer}
          />

          {/* Upcoming Bookings List */}
          <UpcomingBookingsList
            bookings={bookings.map(b => ({
              ...b,
              totalAmount: b.totalAmount ?? 0,
              // Ensure date strings are compatible if needed, though they seem to be strings in both places?
              // UpcomingBookingsList props likely expect string or Date.
            }))}
            onViewBooking={onViewBooking}
            onContactCustomer={onContactCustomer}
            onConfirmBooking={onConfirmBooking}
            onCancelBooking={onCancelBooking}
            onViewAll={onViewAllBookings}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Revenue Snapshot */}
          <QuickRevenueSnapshot
            revenue={{
              today: currentStats.monthlyRevenue * 0.1, // Mock today's revenue
              thisWeek: currentStats.weeklyRevenue ?? 0,
              thisMonth: currentStats.monthlyRevenue,
              lastWeek: currentStats.lastWeekRevenue ?? 0,
              lastMonth: currentStats.lastMonthRevenue ?? 0,
            }}
            onViewDetails={onViewAnalytics}
          />
        </div>
      </div>

      {/* Court Occupancy Heatmap - Full Width */}
      <CourtOccupancyHeatmap
        organizationId={organization.id}
        organizationSlug={organization.slug}
        facilities={facilities.map(facility => ({
          id: facility.id,
          name: facility.name,
          sportCategories: facility.sportCategories.map(category => ({
            id: category.id,
            name: category.name,
          })),
        }))}
      />

      {/* Getting Started - Only show if no facilities */}
      {currentStats.totalFacilities === 0 && canCreateFacility && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>{t("getStarted")}</span>
            </CardTitle>
            <CardDescription>{t("getStartedDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("createYourFirstFacility")}
              </h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                {t("createFirstFacilityDescription")}
              </p>
              {onCreateFacility && (
                <Button onClick={onCreateFacility} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createFirstFacility")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}