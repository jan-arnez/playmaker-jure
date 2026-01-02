import { prisma } from "@/lib/prisma";
import { notifications } from "@/lib/platform-notifications";

/**
 * Get setting value from database
 */
export async function getSetting<T>(key: string): Promise<T | null> {
  try {
    const setting = await prisma.platformSettings.findUnique({
      where: { key },
    });
    return setting?.value as T | null;
  } catch {
    return null;
  }
}

/**
 * Get facilities by IDs from CMS setting, with fallback
 */
export async function getFacilitiesFromCMS(
  settingKey: string,
  fallbackQuery: { take: number; orderBy?: Record<string, string> },
  sectionName: string
): Promise<{
  facilities: Array<{
    id: string;
    name: string;
    slug: string | null;
    city: string;
    address: string | null;
    description: string | null;
    imageUrl: string | null;
    images: string[];
  }>;
  usedFallback: boolean;
}> {
  try {
    // Try to get CMS-selected facility IDs
    const selectedIds = await getSetting<string[]>(settingKey);

    if (selectedIds && selectedIds.length > 0) {
      // Fetch selected facilities
      const facilities = await prisma.facility.findMany({
        where: { id: { in: selectedIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          address: true,
          description: true,
          imageUrl: true,
          images: true,
        },
      });

      // If we found facilities from CMS selection, return them
      if (facilities.length > 0) {
        return { facilities, usedFallback: false };
      }

      // CMS has IDs but they don't exist anymore - log warning
      await notifications.cmsFallbackUsed(
        sectionName,
        `Selected facility IDs no longer exist: ${selectedIds.join(", ")}`
      );
    }

    // Fallback: return recent facilities
    const fallbackFacilities = await prisma.facility.findMany({
      take: fallbackQuery.take,
      orderBy: fallbackQuery.orderBy || { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        address: true,
        description: true,
        imageUrl: true,
        images: true,
      },
    });

    // Only log fallback if CMS was supposed to have values
    if (selectedIds === null) {
      // Setting doesn't exist - first time, don't log
    } else if (selectedIds.length === 0) {
      // Empty selection - don't log, user chose not to select
    }

    return { facilities: fallbackFacilities, usedFallback: true };
  } catch (error) {
    console.error(`Failed to fetch CMS facilities for ${settingKey}:`, error);

    // On error, return fallback
    const fallbackFacilities = await prisma.facility.findMany({
      take: fallbackQuery.take,
      orderBy: fallbackQuery.orderBy || { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        address: true,
        description: true,
        imageUrl: true,
        images: true,
      },
    });

    await notifications.cmsFallbackUsed(
      sectionName,
      `Error fetching CMS selection: ${error}`
    );

    return { facilities: fallbackFacilities, usedFallback: true };
  }
}

/**
 * Get homepage CMS settings
 */
export async function getHomepageCMSSettings() {
  const [featured, popular, freeThisWeekend] = await Promise.all([
    getFacilitiesFromCMS(
      "homepage.featuredFacilities",
      { take: 6, orderBy: { createdAt: "desc" } },
      "Featured Facilities"
    ),
    getFacilitiesFromCMS(
      "homepage.popularFacilities",
      { take: 8, orderBy: { createdAt: "desc" } },
      "Popular Facilities"
    ),
    getFacilitiesFromCMS(
      "homepage.freeThisWeekendFacilities",
      { take: 6, orderBy: { createdAt: "desc" } },
      "Free This Weekend"
    ),
  ]);

  return {
    featured,
    popular,
    freeThisWeekend,
  };
}
