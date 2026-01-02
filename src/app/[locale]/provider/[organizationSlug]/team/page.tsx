import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { ProviderDashboardLayout } from "@/modules/provider/components/layout/provider-dashboard-layout";
import { FacilityPicker } from "@/modules/provider/components/facility-picker";
import { TeamManagementClient } from "./team-management-client";
import { getMemberFacilities } from "@/lib/facility-access";

interface TeamPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getTranslations("ProviderModule.team");
  
  return {
    title: `${t("team")} | ${resolvedParams.organizationSlug}`,
    description: t("manageTeamMembers"),
  };
}


export default async function TeamPage({ params }: TeamPageProps) {
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
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      invitations: {
        where: {
          status: "pending",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          expiresAt: "desc",
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
    redirect({ href: "/provider", locale });
    return;
  }

  // Determine user role: platform admin uses User.role, others use Member.role
  const userRole = isPlatformAdmin 
    ? "admin"  // Platform admin from User.role
    : organization.members.find((m) => m.userId === user.id)?.role || "";

  // Only owner and platform admin can access team management
  // Note: "admin" here refers to platform admin (User.role), not Member.role
  if (userRole !== "owner" && userRole !== "admin") {
    redirect({ href: "/unauthorized", locale });
    return;
  }

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
      <TeamManagementClient
        organization={{
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        }}
        userRole={userRole || ""}
        members={await Promise.all(
          organization.members.map(async (member) => {
            const assignedFacilities =
              member.role === "member" ? await getMemberFacilities(member.id) : [];
            return {
              id: member.id,
              name: member.user.name || member.user.email || "Unknown",
              email: member.user.email,
              role: member.role as "owner" | "member",  // Member.role never includes "admin"
              joinedAt: member.createdAt.toISOString(),
              facilities: assignedFacilities.map((f) => ({
                id: f.id,
                name: f.name,
              })),
            };
          })
        )}
        pendingInvitations={organization.invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          role: (invitation.role || "member") as "owner" | "member",
          status: invitation.status,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.expiresAt.toISOString(), // Invitation model doesn't have createdAt, using expiresAt as reference
          inviterName: invitation.user.name || invitation.user.email || "Unknown",
        }))}
        facilities={organization.facilities.map((facility) => ({
          id: facility.id,
          name: facility.name,
        }))}
      />
    </ProviderDashboardLayout>
  );
}
