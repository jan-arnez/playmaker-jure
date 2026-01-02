import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";
import { OrganizationSettingsClient } from "./organization-settings-client";
import { getAccessibleFacilitiesWithData } from "@/lib/facility-access";
import { getUserRole } from "@/lib/get-user-role";

interface SettingsPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          phone: true,
          email: true,
          website: true,
          facilities: true,
          defaultSeasonStartDate: true,
          defaultSeasonEndDate: true,
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

  // Only owner and platform admin can access settings
  // Note: "admin" here refers to platform admin (User.role), not Member.role
  if (userRole !== "owner" && userRole !== "admin") {
    redirect({ href: "/unauthorized", locale });
    return;
  }

  // Get accessible facilities based on user role
  const accessibleFacilities = await getAccessibleFacilitiesWithData(
    user.id,
    organization.id,
    userRole
  );
  const accessibleFacilityIds = new Set(accessibleFacilities.map((f) => f.id));
  const filteredFacilities = organization.facilities.filter((facility) =>
    accessibleFacilityIds.has(facility.id)
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
      <div className="p-6">
        <OrganizationSettingsClient
          organizationId={organization.id}
          organizationSlug={organization.slug}
          rainSlotsEnabled={organization.rainSlotsEnabled ?? true}
          userRole={userRole}
          facilities={filteredFacilities.map((f) => ({
            id: f.id,
            name: f.name,
            address: f.address,
            city: f.city,
            phone: f.phone || undefined,
            email: f.email || undefined,
            website: f.website || undefined,
            facilities: f.facilities || [],
            defaultSeasonStartDate: f.defaultSeasonStartDate || undefined,
            defaultSeasonEndDate: f.defaultSeasonEndDate || undefined,
          }))}
        />
      </div>
    </ProviderDashboardLayout>
  );
}
