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
    redirect({ href: "/providers/login", locale });
    return;
  }

  // Check if user is a member of any organization
  const organizationMember = await prisma.organization.findFirst({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!organizationMember) {
    // User is not a member of any organization
    redirect({ href: "/providers/login", locale });
    return;
  }

  return children;
}
