"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";

export async function createFacility(
  formData: FormData,
  organizationId: string
) {
  const session = await getServerSession();
  const locale = await getLocale();

  if (!session?.user) {
    redirect({ href: "/providers/login", locale });
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is a member of the organization
  const membership = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId: organizationId,
    },
  });

  if (!membership) {
    return {
      success: false,
      error: "Not authorized to create facilities for this organization",
    };
  }

  // Check if user has permission to create facilities (owner or admin)
  if (membership.role !== "owner" && membership.role !== "admin") {
    return {
      success: false,
      error: "Insufficient permissions to create facilities",
    };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  try {
    const facility = await prisma.facility.create({
      data: {
        name,
        description,
        address,
        city,
        phone,
        email,
        organizationId,
        createdBy: session.user.id,
      },
    });

    return { success: true, facility };
  } catch (error) {
    console.error("Error creating facility:", error);
    return { success: false, error: "Failed to create facility" };
  }
}
