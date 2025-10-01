import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { BookingsManagement } from "@/modules/provider/components/bookings/bookings-management";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";

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

  // Get the organization and verify user membership
  const organization = await prisma.organization.findFirst({
    where: {
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

  const userRole = organization.members[0]?.role;

  // Flatten all bookings from all facilities
  const allBookings = organization.facilities.flatMap((facility) =>
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
      />
    </ProviderDashboardLayout>
  );
}
