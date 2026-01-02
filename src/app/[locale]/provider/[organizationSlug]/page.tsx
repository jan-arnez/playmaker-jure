import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { ProviderDashboard } from "@/modules/provider/components/provider-dashboard";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";
import { getAccessibleFacilitiesWithData, getMember } from "@/lib/facility-access";
import { NoFacilityAccessMessage } from "@/components/provider/no-facility-access-message";

interface ProviderPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const session = await getServerSession();
  const locale = await getLocale();

  // Await params in Next.js 15
  const resolvedParams = await params;

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
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sportCategories: {
            include: {
              courts: {
                orderBy: { name: "asc" }
              }
            },
            orderBy: { name: "asc" }
          },
          bookings: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              },
              court: {
                select: {
                  name: true,
                }
              }
            },
            orderBy: {
              startTime: "desc"
            }
          },
          _count: {
            select: {
              bookings: true
            }
          }
        }
      },
    },
  });

  if (!organization || !organization.slug) {
    // If organization doesn't exist or user doesn't have access, redirect to base provider page
    // which will handle finding the correct organization
    redirect({ href: "/provider", locale });
    return;
  }

  // Determine user role: platform admin uses User.role, others use Member.role
  const userRole = isPlatformAdmin 
    ? "admin"  // Platform admin from User.role
    : organization.members[0]?.role || "";  // Member.role (owner/member)

  // Get accessible facilities based on user role
  const accessibleFacilities = await getAccessibleFacilitiesWithData(
    user.id,
    organization.id,
    userRole
  );

  // If member has no facilities, show no access message (without layout/sidebar)
  if (userRole === "member" && accessibleFacilities.length === 0) {
    return <NoFacilityAccessMessage />;
  }

  // Filter organization facilities to only accessible ones
  const filteredFacilities = organization.facilities.filter((facility) =>
    accessibleFacilities.some((af) => af.id === facility.id)
  );

  // Calculate metrics for the dashboard
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate facility metrics (only for accessible facilities)
  const facilitiesWithMetrics = filteredFacilities.map((facility) => {
    const todayBookings = facility.bookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= todayStart && bookingDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    }).length;

    const totalCourts = facility.sportCategories.reduce((sum, category) => 
      sum + category.courts.length, 0
    );
    const activeCourts = facility.sportCategories.reduce((sum, category) => 
      sum + category.courts.filter(court => court.isActive).length, 0
    );
    
    // Mock occupancy calculation (in real app, this would be based on actual booking hours)
    const occupancyRate = totalCourts > 0 ? Math.min(100, (todayBookings / totalCourts) * 50) : 0;

    return {
        id: facility.id,
        name: facility.name,
        description: facility.description || undefined,
        address: facility.address,
        city: facility.city,
        phone: facility.phone || undefined,
        email: facility.email || undefined,
        website: facility.website || undefined,
        imageUrl: facility.imageUrl || undefined,
      status: "active" as const,
      todayBookings,
      totalBookings: facility._count.bookings,
      occupancyRate: Math.round(occupancyRate),
        sportCategories: facility.sportCategories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description || undefined,
          type: category.type as "indoor" | "outdoor",
          courts: category.courts.map((court) => ({
            id: court.id,
            name: court.name,
            description: court.description || undefined,
            surface: court.surface || undefined,
            capacity: court.capacity || undefined,
            isActive: court.isActive,
          })),
        })),
        _count: {
          bookings: facility._count.bookings,
        },
        createdAt: facility.createdAt.toISOString(),
        updatedAt: facility.updatedAt.toISOString(),
    };
  });

  // Transform bookings for the dashboard (only from accessible facilities)
  const allBookings = filteredFacilities.flatMap(facility => 
    facility.bookings.map(booking => ({
      id: booking.id,
      facilityId: facility.id,
      facilityName: facility.name,
      courtName: booking.court?.name,
      customerName: booking.user.name,
      customerEmail: booking.user.email,
      customerPhone: undefined, // Not available in current schema
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status as "confirmed" | "pending" | "cancelled" | "completed",
      totalAmount: 50, // Mock amount - would come from pricing data
      notes: booking.notes || undefined,
      createdAt: booking.createdAt.toISOString(),
    }))
  );

  // Calculate dashboard stats
  const todayBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.startTime);
    return bookingDate >= todayStart && bookingDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  }).length;

  const weekBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.startTime);
    return bookingDate >= weekStart && bookingDate < now;
  }).length;

  const monthBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.startTime);
    return bookingDate >= monthStart && bookingDate < now;
  }).length;

  const pendingBookings = allBookings.filter(booking => booking.status === "pending").length;
  const confirmedBookings = allBookings.filter(booking => booking.status === "confirmed").length;

  // Mock revenue calculations (in real app, this would come from actual pricing)
  const monthlyRevenue = monthBookings * 50;
  const weeklyRevenue = weekBookings * 50;
  const lastWeekRevenue = Math.max(0, weeklyRevenue - Math.floor(Math.random() * 200)); // Mock previous week
  const lastMonthRevenue = Math.max(0, monthlyRevenue - Math.floor(Math.random() * 1000)); // Mock previous month

  // Calculate average occupancy across all facilities
  const averageOccupancy = facilitiesWithMetrics.length > 0 
    ? Math.round(facilitiesWithMetrics.reduce((sum, facility) => sum + facility.occupancyRate, 0) / facilitiesWithMetrics.length)
    : 0;

  // Mock pending actions (in real app, this would come from actual data)
  const pendingActions = [
    ...(pendingBookings > 0 ? [{
      id: "pending-bookings",
      type: "booking" as const,
      title: `${pendingBookings} Pending Bookings`,
      description: "Bookings waiting for approval",
      priority: "high" as const,
      createdAt: new Date(),
      actionRequired: true,
    }] : []),
    ...(facilitiesWithMetrics.some(f => f.occupancyRate > 90) ? [{
      id: "high-occupancy",
      type: "notification" as const,
      title: "High Occupancy Alert",
      description: "Some facilities are at high capacity",
      priority: "medium" as const,
      createdAt: new Date(),
      actionRequired: false,
    }] : []),
  ];

  return (
    <ProviderDashboard
      organization={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
      }}
      userRole={userRole}
      facilities={facilitiesWithMetrics}
      bookings={allBookings}
      stats={{
        totalFacilities: facilitiesWithMetrics.length,
        totalBookings: allBookings.length,
        activeBookings: confirmedBookings,
        teamMembers: 1, // This would come from organization members
        monthlyRevenue,
        pendingBookings,
        occupancyRate: averageOccupancy,
        averageRating: 4.5, // Mock rating
        todayBookings,
        weeklyRevenue,
        lastWeekRevenue,
        lastMonthRevenue,
      }}
      pendingActions={pendingActions}
    />
  );
}
