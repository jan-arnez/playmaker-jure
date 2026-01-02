import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { BookingsManagement } from "@/modules/provider/components/bookings/bookings-management";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";
import { getAccessibleFacilities } from "@/lib/facility-access";
import { NoFacilityAccessMessage } from "@/components/provider/no-facility-access-message";
import { getUserRole } from "@/lib/get-user-role";

interface BookingsPageProps {
  params: {
    organizationSlug: string;
  };
}

export default async function BookingsPage({ params }: BookingsPageProps) {
  const session = await getServerSession();
  const locale = await getLocale();

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
      ? { slug: params.organizationSlug }
      : {
          slug: params.organizationSlug,
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
                  name: true,
                  email: true,
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

  // Filter facilities to only accessible ones
  const accessibleFacilityIdsSet = new Set(accessibleFacilityIds);
  const filteredFacilities = organization.facilities.filter((facility) =>
    accessibleFacilityIdsSet.has(facility.id)
  );

  // Flatten all bookings from accessible facilities only
  const allBookings = filteredFacilities.flatMap((facility) =>
    facility.bookings.map((booking) => ({
      id: booking.id,
      facilityId: facility.id,
      facilityName: facility.name,
      customerName: booking.user.name,
      customerEmail: booking.user.email,
      customerPhone: "", // Not stored in current schema
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status as
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed",
      createdAt: booking.createdAt.toISOString(),
      totalAmount: 0, // Not implemented yet
      notes: booking.notes,
    }))
  );

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
      <BookingsManagement
        _organization={{
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        }}
        userRole={userRole}
        bookings={allBookings}
        facilities={filteredFacilities.map((facility) => ({
          id: facility.id,
          name: facility.name,
        }))}
      />
    </ProviderDashboardLayout>
  );
}
