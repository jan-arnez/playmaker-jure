"use server";

import { prisma } from "@/lib/prisma";

export interface RelatedFacility {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  imageUrl: string | null;
  pricePerHour: number | null;
  currency: string | null;
  locationType: string | null;
  sportCategories: { name: string }[];
}

export async function getRelatedFacilities(
  currentFacilityId: string,
  city: string,
  sportCategoryIds: string[],
  limit: number = 4
): Promise<RelatedFacility[]> {
  // First try: Same city + same sport categories
  let relatedFacilities = await prisma.facility.findMany({
    where: {
      id: { not: currentFacilityId },
      city: city,
      status: "active",
      sportCategories: {
        some: {
          id: { in: sportCategoryIds },
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: true,
      imageUrl: true,
      pricePerHour: true,
      currency: true,
      locationType: true,
      sportCategories: {
        select: { name: true },
      },
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  // If we don't have enough, fallback to same city any sport
  if (relatedFacilities.length < limit) {
    const additionalCount = limit - relatedFacilities.length;
    const existingIds = relatedFacilities.map((f) => f.id);
    
    const additionalFacilities = await prisma.facility.findMany({
      where: {
        id: { 
          not: currentFacilityId,
          notIn: existingIds,
        },
        city: city,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        city: true,
        imageUrl: true,
        pricePerHour: true,
        currency: true,
        locationType: true,
        sportCategories: {
          select: { name: true },
        },
      },
      take: additionalCount,
      orderBy: {
        createdAt: "desc",
      },
    });
    
    relatedFacilities = [...relatedFacilities, ...additionalFacilities];
  }

  // If still not enough, get any facilities
  if (relatedFacilities.length < limit) {
    const additionalCount = limit - relatedFacilities.length;
    const existingIds = relatedFacilities.map((f) => f.id);
    
    const additionalFacilities = await prisma.facility.findMany({
      where: {
        id: { 
          not: currentFacilityId,
          notIn: existingIds,
        },
        status: "active",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        city: true,
        imageUrl: true,
        pricePerHour: true,
        currency: true,
        locationType: true,
        sportCategories: {
          select: { name: true },
        },
      },
      take: additionalCount,
      orderBy: {
        createdAt: "desc",
      },
    });
    
    relatedFacilities = [...relatedFacilities, ...additionalFacilities];
  }

  return relatedFacilities;
}


