"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/modules/auth/lib/auth";

export async function deleteOrganization(organizationId: string) {
  const locale = await getLocale();
  const t = await getTranslations("AdminModule.serverActions");

  try {
    // Validate session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user;

    if (!user) {
      return { error: t("unauthenticated") };
    }

    if (user.role !== "admin") {
      return { error: t("unauthorized") };
    }

    if (!organizationId) {
      return { error: t("organizationIdMissing") };
    }

    // Check if organization exists first
    const existingOrganization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!existingOrganization) {
      return { error: "Organization not found" };
    }

    // Delete the organization
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    // Revalidate the organizations page
    revalidatePath(`${locale}/admin/organizations`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return { error: "Failed to delete organization" };
  }
}
