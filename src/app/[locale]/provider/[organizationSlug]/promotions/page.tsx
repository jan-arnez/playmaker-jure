import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { PromotionsDashboard } from "@/modules/provider/components/promotions/promotions-dashboard";
import { getAccessibleFacilities } from "@/lib/facility-access";
import { NoFacilityAccessMessage } from "@/components/provider/no-facility-access-message";
import { getUserRole } from "@/lib/get-user-role";

interface PromotionsPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
}

export default async function PromotionsPage({ params }: PromotionsPageProps) {
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
                where: { isActive: true },
                orderBy: { name: "asc" },
              },
            },
            orderBy: { name: "asc" },
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

  return (
    <PromotionsDashboard
      organization={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
      }}
      userRole={userRole}
      facilities={filteredFacilities.map((facility) => ({
        id: facility.id,
        name: facility.name,
        description: facility.description || undefined,
        address: facility.address,
        city: facility.city,
        phone: facility.phone || undefined,
        email: facility.email || undefined,
        createdAt: facility.createdAt.toISOString(),
        updatedAt: facility.updatedAt.toISOString(),
        sportCategories: facility.sportCategories.map((sc) => ({
          id: sc.id,
          name: sc.name,
          type: sc.type,
          courts: sc.courts.map((c) => ({
            id: c.id,
            name: c.name,
          })),
        })),
      }))}
    />
  );
}



