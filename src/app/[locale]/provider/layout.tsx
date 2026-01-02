import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

export default async function ProviderLayout({ children }: PropsWithChildren) {
  const session = await getServerSession();
  const locale = await getLocale();

  const user = session?.user;

  if (!user) {
    redirect({ href: "/signin/provider", locale });
    return;
  }

  /*
   * SECURITY NOTE: Platform admin (User.role === "admin") has access to all organizations
   * even without Member record. Regular users must be members of an organization.
   */
  const isPlatformAdmin = user.role === "admin";

  // Check if user is a member of any organization (or is platform admin)
  const organizationMember = await prisma.organization.findFirst({
    where: {
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
          id: true,
          role: true,
        },
      },
    },
  });

  if (!organizationMember && !isPlatformAdmin) {
    // User is not a member of any organization and is not platform admin
    redirect({ href: "/signin/provider", locale });
    return;
  }

  // Check if member has access to any facilities (only for members, not owners/platform admins)
  const userMember = organizationMember?.members[0];
  if (userMember && userMember.role === "member" && !isPlatformAdmin) {
    const facilityCount = await prisma.facilityMember.count({
      where: {
        memberId: userMember.id,
      },
    });

    // If member has no facilities, redirect to unauthorized
    if (facilityCount === 0) {
      redirect({ href: "/unauthorized", locale });
      return;
    }
  }

  return children;
}
