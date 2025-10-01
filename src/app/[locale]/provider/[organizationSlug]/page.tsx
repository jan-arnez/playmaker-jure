import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { ProviderDashboard } from "@/modules/provider/components/provider-dashboard";

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

  // Get the organization and verify user membership
  const organization = await prisma.organization.findFirst({
    where: {
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
      },
    },
  });

  if (!organization || !organization.slug) {
    // If organization doesn't exist or user doesn't have access, redirect to base provider page
    // which will handle finding the correct organization
    redirect({ href: "/provider", locale });
    return;
  }

  const userRole = organization.members[0]?.role;

  return (
    <ProviderDashboard
      organization={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
      }}
      userRole={userRole}
      facilities={organization.facilities.map((facility) => ({
        id: facility.id,
        name: facility.name,
        description: facility.description || undefined,
        address: facility.address,
        city: facility.city,
        phone: facility.phone || undefined,
        email: facility.email || undefined,
        createdAt: facility.createdAt.toISOString(),
        updatedAt: facility.updatedAt.toISOString(),
      }))}
      bookings={[]} // Empty for now, will be populated when booking system is implemented
    />
  );
}
