import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { Analytics } from "@/modules/provider/components/analytics/analytics";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";

interface AnalyticsPageProps {
  params: {
    organizationSlug: string;
  };
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
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

  // Calculate analytics from real data
  const allBookings = organization.facilities.flatMap(
    (facility) => facility.bookings
  );
  const totalBookings = allBookings.length;

  // Calculate monthly bookings (current month)
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyBookings = allBookings.filter(
    (booking) => new Date(booking.createdAt) >= currentMonth
  ).length;

  // Calculate revenue (assuming €50 per booking for now)
  const bookingValue = 50;
  const totalRevenue = totalBookings * bookingValue;
  const monthlyRevenue = monthlyBookings * bookingValue;

  // Calculate booking growth (simplified)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  lastMonth.setDate(1);
  lastMonth.setHours(0, 0, 0, 0);

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const lastMonthBookings = allBookings.filter((booking) => {
    const bookingDate = new Date(booking.createdAt);
    return bookingDate >= lastMonth && bookingDate < thisMonthStart;
  }).length;

  const bookingGrowth =
    lastMonthBookings > 0
      ? ((monthlyBookings - lastMonthBookings) / lastMonthBookings) * 100
      : 0;

  const revenueGrowth = bookingGrowth; // Same as booking growth for simplicity

  // Top facilities by booking count
  const topFacilities = organization.facilities
    .map((facility) => ({
      id: facility.id,
      name: facility.name,
      bookingCount: facility.bookings.length,
      revenue: facility.bookings.length * bookingValue,
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  const analytics = {
    totalRevenue,
    monthlyRevenue,
    revenueGrowth,
    totalBookings,
    monthlyBookings,
    bookingGrowth,
    totalFacilities: organization.facilities.length,
    activeFacilities: organization.facilities.filter(
      (f) => f.bookings.length > 0
    ).length,
    averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
    topFacilities,
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
      <Analytics
        _organization={{
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        }}
        _userRole={userRole}
        analytics={analytics}
      />
    </ProviderDashboardLayout>
  );
}
