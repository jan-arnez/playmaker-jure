import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";
import { FacilitiesClient } from "./facilities-client";
import { getAccessibleFacilitiesWithData } from "@/lib/facility-access";
import { NoFacilityAccessMessage } from "@/components/provider/no-facility-access-message";
import { getUserRole } from "@/lib/get-user-role";

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
    redirect({ href: "/signin/provider", locale });
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
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sportCategories: {
            include: {
              courts: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      },
    },
  });

  if (!organization || !organization.slug) {
    redirect({ href: "/signin/provider", locale });
    return;
  }

  // Determine user role: platform admin uses User.role, others use Member.role
  const userRole = getUserRole(user, organization.members[0]?.role);

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
      <FacilitiesClient
        organizationId={organization.id}
        userRole={userRole}
        facilities={filteredFacilities.map((facility) => ({
          id: facility.id,
          name: facility.name,
          description: facility.description || undefined,
          address: facility.address,
          city: facility.city,
          phone: facility.phone || undefined,
          email: facility.email || undefined,
          website: facility.website || undefined,
          imageUrl: facility.imageUrl || undefined,
          images: facility.images || [],
          locationType: (facility.locationType as "indoor" | "outdoor") || undefined,
          surface: facility.surface || undefined,
          facilities: facility.facilities || [],
          workingHours: facility.workingHours ? (typeof facility.workingHours === 'string' ? JSON.parse(facility.workingHours) : facility.workingHours) : undefined,
          rules: facility.rules || undefined,
          capacity: facility.capacity || undefined,
          pricePerHour: facility.pricePerHour ? Number(facility.pricePerHour) : undefined,
          currency: facility.currency || "EUR",
          status: (facility.status as "active" | "inactive" | "maintenance") || "active",
          organizationId: facility.organizationId,
          sportCategories: facility.sportCategories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description || undefined,
            type: category.type as "indoor" | "outdoor",
            createdAt: category.createdAt.toISOString(),
            updatedAt: category.updatedAt.toISOString(),
            courts: category.courts.map((court) => ({
              id: court.id,
              name: court.name,
              description: court.description || undefined,
              surface: court.surface || undefined,
              capacity: court.capacity || undefined,
              isActive: court.isActive,
              timeSlots: court.timeSlots || [],
              locationType: court.locationType as "indoor" | "outdoor" | undefined,
              workingHours: court.workingHours ? (typeof court.workingHours === 'string' ? JSON.parse(court.workingHours) : court.workingHours) : undefined,
              pricing: court.pricing ? (typeof court.pricing === 'string' ? JSON.parse(court.pricing) : court.pricing) : undefined,
              createdAt: court.createdAt.toISOString(),
              updatedAt: court.updatedAt.toISOString(),
            })),
          })),
          _count: {
            bookings: facility._count.bookings,
          },
          createdAt: facility.createdAt.toISOString(),
          updatedAt: facility.updatedAt.toISOString(),
        }))}
      />
    </ProviderDashboardLayout>
  );
}
