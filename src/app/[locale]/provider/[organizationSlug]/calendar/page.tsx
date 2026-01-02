import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";
import { CalendarClient } from "./calendar-client";
import { BookingsList } from "@/modules/provider/components/calendar/bookings-list";
import { getAccessibleFacilities } from "@/lib/facility-access";
import { NoFacilityAccessMessage } from "@/components/provider/no-facility-access-message";
import { getUserRole } from "@/lib/get-user-role";

interface CalendarPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
  searchParams: Promise<{
    view?: string;
  }>;
}

export default async function CalendarPage({ params, searchParams }: CalendarPageProps) {
  const session = await getServerSession();
  const locale = await getLocale();

  // Await params and searchParams in Next.js 15
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

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
          sportCategories: {
            include: {
              courts: {
                where: {
                  isActive: true,
                },
                orderBy: {
                  name: "asc",
                },
              },
            },
            orderBy: {
              name: "asc",
            },
          },
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
              startTime: "asc",
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
  const rainSlotsEnabled = organization.rainSlotsEnabled ?? true;

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

  // Get all courts from accessible facilities only
  const allCourts = filteredFacilities.flatMap((facility) =>
    facility.sportCategories.flatMap((category) =>
      category.courts.map((court) => ({
        id: court.id,
        name: court.name,
        facility: {
          id: facility.id,
          name: facility.name,
        },
        sportCategory: {
          id: category.id,
          name: category.name,
        },
      }))
    )
  );

  // Flatten all bookings from accessible facilities for calendar (Date objects)
  const calendarBookings = filteredFacilities.flatMap((facility) =>
    facility.bookings.map((booking) => ({
      id: booking.id,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status as
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no-show",
      facility: {
        id: facility.id,
        name: facility.name,
        slug: facility.id, // Using ID as slug for now
      },
      court: booking.court
        ? {
            id: booking.court.id,
            name: booking.court.name,
            sportCategory: {
              id: booking.court.sportCategory.id,
              name: booking.court.sportCategory.name,
            },
          }
        : null,
      user: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email,
      },
    }))
  );

  // Flatten all bookings from accessible facilities for list (string dates)
  // Count visits per user
  const userVisitCounts = new Map<string, number>();
  filteredFacilities.forEach((facility) => {
    facility.bookings.forEach((booking) => {
      const count = userVisitCounts.get(booking.user.id) || 0;
      userVisitCounts.set(booking.user.id, count + 1);
    });
  });

  const listBookings = filteredFacilities.flatMap((facility) =>
    facility.bookings.map((booking) => ({
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      status: booking.status as
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no-show",
      notes: booking.notes,
      facility: {
        id: facility.id,
        name: facility.name,
        slug: facility.id, // Using ID as slug for now
      },
      court: booking.court
        ? {
            id: booking.court.id,
            name: booking.court.name,
            sportCategory: {
              id: booking.court.sportCategory.id,
              name: booking.court.sportCategory.name,
            },
          }
        : null,
      user: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email,
      },
      visitCount: userVisitCounts.get(booking.user.id) || 0,
    }))
  );

  const currentView = resolvedSearchParams.view || "calendar";

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
      <div className="p-6">
        {/* Content based on view */}
        {currentView === "calendar" ? (
          <CalendarClient
            facilities={filteredFacilities.map((facility) => ({
              id: facility.id,
              name: facility.name,
              slug: facility.id, // Using ID as slug for now
            }))}
            courts={allCourts}
            bookings={calendarBookings}
            organizationId={organization.id}
            organizationSlug={organization.slug}
            userRole={userRole as "owner" | "admin" | "staff" | undefined}
            rainSlotsEnabled={rainSlotsEnabled}
          />
        ) : (
          <BookingsList
            bookings={listBookings}
            facilities={filteredFacilities.map((facility) => ({
              id: facility.id,
              name: facility.name,
              slug: facility.id, // Using ID as slug for now
            }))}
            courts={allCourts}
            organizationId={organization.id}
            organizationSlug={organization.slug}
          />
        )}
      </div>
    </ProviderDashboardLayout>
  );
}
