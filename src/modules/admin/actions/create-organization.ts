"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/modules/auth/lib/auth";

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Invalid slug format"),
});

export async function createOrganization(formData: FormData) {
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

    // Parse and validate form data
    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
    };

    const validatedData = createOrganizationSchema.parse(rawData);

    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: validatedData.slug },
      select: {
        id: true,
      },
    });

    if (existingOrg) {
      return { error: t("organizationSlugExists") };
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        id: randomUUID(),
        name: validatedData.name,
        slug: validatedData.slug,
        createdAt: new Date(),
        members: {
          create: {
            id: randomUUID(),
            userId: user.id,
            createdAt: new Date(),
            role: "owner",
          },
        },
      },
    });

    // Revalidate the organizations page
    revalidatePath(`${locale}/admin/organizations`);

    return { success: true, organization };
  } catch (error) {
    console.error("Error creating organization:", error);

    if (error instanceof z.ZodError) {
      return { error: t("invalidFormData"), details: error.message };
    }

    return { error: t("failedToCreateOrganization") };
  }
}
