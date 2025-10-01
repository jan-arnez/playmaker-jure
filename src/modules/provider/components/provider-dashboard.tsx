"use client";

import { useState } from "react";
import { DashboardOverview } from "./dashboard/dashboard-overview";
import { ProviderDashboardLayout } from "./layout/provider-dashboard-layout";

interface ProviderDashboardProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
  userRole: string;
  facilities?: Array<{
    id: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    phone?: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  bookings?: Array<{
    id: string;
    facilityId: string;
    facilityName: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    startTime: string;
    endTime: string;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    createdAt: string;
    totalAmount: number;
  }>;
}

export function ProviderDashboard({
  organization,
  userRole,
  facilities = [],
  bookings = [],
}: ProviderDashboardProps) {
  const [_showCreateFacility, _setShowCreateFacility] = useState(false);

  // Calculate stats from data
  const stats = {
    totalFacilities: facilities.length,
    totalBookings: bookings.length,
    activeBookings: bookings.filter((b) => b.status === "confirmed").length,
    teamMembers: 1, // This would come from organization members
    monthlyRevenue: bookings
      .filter((b) => {
        const bookingDate = new Date(b.createdAt);
        const now = new Date();
        return (
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, b) => sum + b.totalAmount, 0),
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
  };

  return (
    <ProviderDashboardLayout organization={organization} userRole={userRole}>
      <DashboardOverview stats={stats} onCreateFacility={() => {}} />
    </ProviderDashboardLayout>
  );
}
