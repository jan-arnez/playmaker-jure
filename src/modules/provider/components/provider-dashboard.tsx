"use client";

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
    imageUrl?: string;
    status: "active" | "inactive" | "maintenance";
    todayBookings: number;
    totalBookings: number;
    occupancyRate: number;
    sportCategories: Array<{
      id: string;
      name: string;
      description?: string;
      type: "indoor" | "outdoor";
      courts: Array<{
        id: string;
        name: string;
        description?: string;
        surface?: string;
        capacity?: number;
        isActive: boolean;
      }>;
    }>;
    _count: {
      bookings: number;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  bookings?: Array<{
    id: string;
    facilityId: string;
    facilityName: string;
    courtName?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    startTime: string;
    endTime: string;
    status: "confirmed" | "pending" | "cancelled" | "completed";
    totalAmount: number;
    notes?: string;
    createdAt: string;
  }>;
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
}

export function ProviderDashboard({
  organization,
  userRole,
  facilities = [],
  bookings = [],
  stats,
  pendingActions = [],
}: ProviderDashboardProps) {
  return (
    <ProviderDashboardLayout organization={organization} userRole={userRole}>
      <div className="space-y-6">
        <DashboardOverview 
          stats={stats}
          facilities={facilities}
          bookings={bookings}
          pendingActions={pendingActions}
          onCreateFacility={() => {}}
          onViewFacility={(facilityId) => {
            console.log('View facility:', facilityId);
          }}
          onManageFacility={(facilityId) => {
            console.log('Manage facility:', facilityId);
          }}
          onAddBooking={(facilityId) => {
            console.log('Add booking for facility:', facilityId);
          }}
          onViewBooking={(bookingId) => {
            console.log('View booking:', bookingId);
          }}
          onContactCustomer={(email, phone) => {
            console.log('Contact customer:', email, phone);
          }}
          onConfirmBooking={(bookingId) => {
            console.log('Confirm booking:', bookingId);
          }}
          onCancelBooking={(bookingId) => {
            console.log('Cancel booking:', bookingId);
          }}
          onViewAllBookings={() => {
            console.log('View all bookings');
          }}
          onViewAllActions={() => {
            console.log('View all actions');
          }}
          onViewAnalytics={() => {
            console.log('View analytics');
          }}
        />
      </div>
    </ProviderDashboardLayout>
  );
}