import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";
import { SeasonalTermsClient } from "./seasonal-terms-client";
import { getAccessibleFacilities } from "@/lib/facility-access";
import { NoFacilityAccessMessage } from "@/components/provider/no-facility-access-message";
import { getUserRole } from "@/lib/get-user-role";

interface SeasonalTermsPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
}

export default async function SeasonalTermsPage({ params }: SeasonalTermsPageProps) {
  const session = await getServerSession();
  const locale = await getLocale();

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
                orderBy: { name: "asc" },
              },
            },
            orderBy: { name: "asc" },
          },
          bookings: {
            where: {
              isSeasonal: true,
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
              court: {
                select: {
                  id: true,
                  name: true,
                  sportCategory: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!organization || !organization.slug) {
    redirect({ href: "/provider", locale });
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

  // Filter facilities to only accessible ones
  const accessibleFacilityIdsSet = new Set(accessibleFacilityIds);
  const filteredFacilities = organization.facilities.filter((facility) =>
    accessibleFacilityIdsSet.has(facility.id)
  );

  // Get all seasonal bookings and group by series
  type BookingWithFacility = typeof filteredFacilities[0]['bookings'][0] & { facilityName: string };
  
  const allSeasonalBookings: BookingWithFacility[] = filteredFacilities.flatMap((facility) => 
    facility.bookings.map((booking) => ({
      ...booking,
      facilityName: facility.name,
    }))
  );

  // Group by seasonalSeriesId (parent bookings have parentBookingId = null)
  const seasonalSeries = new Map<string, BookingWithFacility[]>();
  
  for (const booking of allSeasonalBookings) {
    const seriesId = booking.seasonalSeriesId || booking.id;
    if (!seasonalSeries.has(seriesId)) {
      seasonalSeries.set(seriesId, []);
    }
    seasonalSeries.get(seriesId)!.push(booking);
  }

  // Transform to seasonal series format
  const seasonalSeriesData = Array.from(seasonalSeries.entries()).map(([seriesId, bookings]) => {
    // Find parent booking (the one that defines the pattern)
    const parentBooking = bookings.find((b) => !b.parentBookingId) || bookings[0];
    
    return {
      seriesId,
      parentBookingId: parentBooking.id,
      courtId: parentBooking.courtId || "",
      courtName: parentBooking.court?.name || "",
      facilityId: parentBooking.facilityId,
      facilityName: parentBooking.facilityName,
      sportCategoryName: parentBooking.court?.sportCategory?.name || "",
      startDate: parentBooking.seasonalStartDate?.toISOString() || parentBooking.startTime.toISOString(),
      endDate: parentBooking.seasonalEndDate?.toISOString() || parentBooking.endTime.toISOString(),
      dayOfWeek: parentBooking.dayOfWeek ?? null,
      startTime: parentBooking.startTime.toISOString(),
      endTime: parentBooking.endTime.toISOString(),
      status: parentBooking.status as "pending" | "confirmed" | "rejected" | "active" | "completed",
      customerName: parentBooking.user?.name || undefined,
      customerEmail: parentBooking.user?.email || undefined,
      notes: parentBooking.notes || undefined,
      createdAt: parentBooking.createdAt.toISOString(),
      bookingCount: bookings.length,
      bookings: bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
      })),
    };
  });

  // Transform facilities with courts and working hours (only accessible ones)
  const facilitiesWithData = filteredFacilities.map((facility) => ({
    id: facility.id,
    name: facility.name,
    workingHours: facility.workingHours,
    pricePerHour: facility.pricePerHour ? Number(facility.pricePerHour) : undefined,
    sportCategories: facility.sportCategories.map((category) => ({
      id: category.id,
      name: category.name,
      courts: category.courts.map((court) => ({
        id: court.id,
        name: court.name,
        facilityId: facility.id,
        facilityName: facility.name,
        sportCategoryName: category.name,
      })),
    })),
  }));

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
      <SeasonalTermsClient
        organizationId={organization.id}
        userRole={userRole}
        facilities={facilitiesWithData}
        seasonalSeries={seasonalSeriesData}
      />
    </ProviderDashboardLayout>
  );
}

