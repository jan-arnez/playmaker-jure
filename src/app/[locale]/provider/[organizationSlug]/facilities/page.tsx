import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { FacilitiesManagement } from "@/modules/provider/components/facilities/facilities-management";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";

interface FacilitiesPageProps {
  params: {
    organizationSlug: string;
  };
}

export default async function FacilitiesPage({ params }: FacilitiesPageProps) {
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
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!organization || !organization.slug) {
    redirect({ href: "/providers/login", locale });
    return;
  }

  const userRole = organization.members[0]?.role;

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
      <FacilitiesManagement
        _organization={{
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
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
      />
    </ProviderDashboardLayout>
  );
}
