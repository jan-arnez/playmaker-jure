import { MapPin, Filter } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/layout/footer";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { prisma } from "@/lib/prisma";
import { FacilityCard } from "@/modules/platform/components/facility/facility-card";
import { EnhancedFacilitiesFilters } from "@/components/enhanced-facilities-filters";
import { ActiveFiltersChips } from "@/components/active-filters-chips";
import { FacilitiesHeader } from "@/components/facilities-header";
import { FacilitiesResultsHeader } from "@/components/facilities-results-header";
import { FacilitiesGrid } from "@/components/facilities-grid";
import { FacilitiesEmptyState } from "@/components/facilities-empty-state";
import { PaginationClient } from "@/components/pagination-client";
import { getCitiesInRegion, getRegionFromCity } from "@/lib/region-mapping";
import { formatAddress } from "@/lib/address-formatting";
import { getSportNameVariations } from "@/lib/sport-mapping";
import { SPORTS_LIST } from "@/lib/filter-constants";
import { calculateFacilityAvailability } from "@/lib/facility-availability";
import { slovenianRegions } from "@/config/regions";

interface FacilitiesPageProps {
  searchParams: {
    search?: string;
    city?: string;
    region?: string;
    sport?: string;
    date?: string;
    time?: string;
    locationType?: string;
    surface?: string;
    facilities?: string;
    page?: string;
  };
}

export default async function Facilities({
  searchParams,
}: FacilitiesPageProps) {
  // Await searchParams in Next.js 15
  const params = await searchParams;
  
  // Get translations
  const t = await getTranslations("PlatformModule.facilitiesPage");
  const tFilters = await getTranslations("filters");
  
  // Pagination
  const currentPage = parseInt(params.page || "1");
  const itemsPerPage = 12;
  const skip = (currentPage - 1) * itemsPerPage;
  
  // Build search filters
  const whereClause: Record<string, unknown> = {};
  const andConditions: Record<string, unknown>[] = [];

  // Handle text search - search across name, description, city, and sports
  if (params.search) {
    andConditions.push({
      OR: [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { city: { contains: params.search, mode: "insensitive" } },
        { sportCategories: { some: { name: { contains: params.search, mode: "insensitive" } } } },
      ]
    });
  }

  // Handle city filter
  if (params.city && params.city !== "all") {
    andConditions.push({
      city: { contains: params.city, mode: "insensitive" }
    });
  }

  // Handle region filter
  if (params.region && params.region !== "all") {
    // Use centralized region mapping function to get all cities in the region
    const citiesInRegion = getCitiesInRegion(params.region);
    if (citiesInRegion.length > 0) {
      // Normalize function to match cities with/without diacritics
      const normalizeCity = (name: string) => 
        name.toLowerCase()
            .trim()
            .replace(/š/g, "s").replace(/č/g, "c").replace(/ž/g, "z")
            .replace(/ć/g, "c").replace(/đ/g, "d");
      
      // Create a set of all possible city name variations (with and without diacritics)
      const cityVariations = new Set<string>();
      citiesInRegion.forEach(city => {
        const cityLower = city.toLowerCase().trim();
        cityVariations.add(cityLower);
        // Add normalized version (without diacritics)
        const normalized = normalizeCity(city);
        cityVariations.add(normalized);
        // Also try removing just the diacritics
        cityVariations.add(cityLower.replace(/š/g, "s").replace(/č/g, "c").replace(/ž/g, "z"));
      });
      
      // Create OR conditions - use equals for exact match first, then contains as fallback
      const cityConditions = Array.from(cityVariations).flatMap(cityName => [
        { city: { equals: cityName, mode: "insensitive" as const } },
        { city: { contains: cityName, mode: "insensitive" as const } }
      ]);
      
      andConditions.push({
        OR: cityConditions
      });
    }
  }
  
  // Handle sport filter
  if (params.sport && params.sport !== "all") {
    // Get all sport name variations (handles Slovenian/English, case variations)
    // Example: "tenis" -> ["tenis", "tennis"] to match both Slovenian and English
    const sportVariations = getSportNameVariations(params.sport);
    if (sportVariations.length > 0) {
      // Prisma doesn't support OR inside some, so we use OR at the facility level
      // Match facilities that have at least one sport category matching any variation
      andConditions.push({
        OR: sportVariations.map(sportName => ({
          sportCategories: {
            some: {
              name: { contains: sportName, mode: "insensitive" as const }
            }
          }
        }))
      });
    }
  }

  // Combine all conditions with AND
  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  if (params.locationType && params.locationType !== "all") {
    whereClause.locationType = params.locationType;
  }

  if (params.surface) {
    const surfaceArray = params.surface.split(',');
    whereClause.surface = {
      in: surfaceArray
    };
  }

  if (params.facilities) {
    const facilitiesArray = params.facilities.split(',');
    whereClause.facilities = {
      hasSome: facilitiesArray
    };
  }

  // Check if any filters are applied
  const hasFilters = !!(
    params.search ||
    (params.city && params.city !== "all") ||
    (params.region && params.region !== "all") ||
    (params.sport && params.sport !== "all") ||
    params.date ||
    (params.time && params.time !== "any") ||
    params.locationType ||
    params.surface ||
    params.facilities
  );

  // Fetch facilities - when no filters, fetch all to sort by popularity
  const [allFacilities, totalCount] = await Promise.all([
    prisma.facility.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        city: true,
        description: true,
        imageUrl: true,
        images: true,
        pricePerHour: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
        sportCategories: {
          select: {
            id: true,
            name: true,
            type: true,
            courts: {
              select: {
                pricing: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: "confirmed",
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      // When no filters, fetch all to sort by popularity, otherwise use pagination
      ...(hasFilters ? { skip, take: itemsPerPage } : {}),
    }),
    prisma.facility.count({
      where: whereClause,
    }),
  ]);

  // If no filters, sort by popularity (booking count) first, then by recency
  let sortedFacilities = allFacilities;
  if (!hasFilters) {
    sortedFacilities = [...allFacilities].sort((a, b) => {
      const aBookings = a.bookings.length;
      const bBookings = b.bookings.length;
      
      // If booking counts are equal, sort by recency
      if (aBookings === bBookings) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      // Sort by booking count (descending) - popular first
      return bBookings - aBookings;
    });
    
    // Apply pagination after sorting
    sortedFacilities = sortedFacilities.slice(skip, skip + itemsPerPage);
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Parse date if provided
  let selectedDate: Date | undefined;
  if (params.date) {
    if (params.date === "today") {
      selectedDate = new Date();
      selectedDate.setHours(0, 0, 0, 0);
    } else {
      selectedDate = new Date(params.date);
      selectedDate.setHours(0, 0, 0, 0);
    }
  }

  // Calculate availability for each facility if filters are applied
  const facilitiesWithAvailability = await Promise.all(
    sortedFacilities.map(async (facility) => {
      let availability: {
        slotsAvailableToday?: number;
        slotsForDate?: number;
        slotsForTimeRange?: string[];
      } = {};
      
      // Only calculate availability if sport, date, or time filters are applied
      if (params.sport || params.date || params.time) {
        const dateToUse = selectedDate || new Date();
        dateToUse.setHours(0, 0, 0, 0);
        
        availability = await calculateFacilityAvailability(
          facility.id,
          dateToUse,
          params.sport && params.sport !== "all" ? params.sport : undefined,
          params.time && params.time !== "any" ? params.time : undefined
        );
      }

      return {
        ...facility,
        availability,
      };
    })
  );

  // Use centralized regions list
  const regions = slovenianRegions;

  const sports = await prisma.sportCategory.findMany({
    select: {
      name: true,
    },
    distinct: ["name"],
    orderBy: {
      name: "asc",
    },
  });

  const filtersProps = {
    initialSearch: params.search || "",
    initialCity: params.city || "all",
    initialRegion: params.region || "all",
    initialSport: params.sport || "all",
    initialDate: params.date || "",
    initialTime: params.time || "any",
    initialLocationType: params.locationType || "all",
    initialSurface: params.surface || "",
    initialFacilities: params.facilities ? params.facilities.split(',') : [],
    cities: [],
  };

  // Generate dynamic page title based on filters
  const getPageTitle = () => {
    const location = params.city && params.city !== "all" 
      ? params.city 
      : params.region && params.region !== "all" 
        ? params.region 
        : null;
    
    let sportName: string | null = null;
    if (params.sport && params.sport !== "all") {
      const sportItem = SPORTS_LIST.find(s => s.slug === params.sport);
      if (sportItem) {
        sportName = tFilters(`sport.${sportItem.translationKey}`);
      }
    }
    
    if (sportName && location) {
      return t("sportIn", { sport: sportName, location });
    }
    if (sportName) {
      return t("sportFacilities", { sport: sportName });
    }
    if (location) {
      return t("facilitiesIn", { location });
    }
    return t("allFacilities");
  };

  // Calculate minPrice and prepare facility data for the grid
  const facilityGridData = facilitiesWithAvailability.map((facility) => {
    // Calculate minimum price from pricing tiers (same logic as landing page)
    let minPrice = 0;
    const prices: number[] = [];

    facility.sportCategories.forEach((category) => {
      category.courts.forEach((court) => {
        const pricing = court.pricing as any;
        if (pricing) {
          if (pricing.basicPrice) {
            prices.push(Number(pricing.basicPrice));
          }
          if (pricing.advancedPricing?.tiers) {
            pricing.advancedPricing.tiers.forEach((tier: any) => {
              if (tier.price) {
                prices.push(Number(tier.price));
              }
            });
          }
        }
      });
    });

    if (prices.length > 0) {
      minPrice = Math.min(...prices);
    }

    return {
                          id: facility.id,
                          slug: facility.slug ?? undefined,
                          title: facility.name,
                          location: `${facility.city}, ${facility.address}`,
    rating: 0,
                          description: "",
                          organization: facility.organization.name,
                          bookingCount: facility.bookings.length,
                          sport: facility.sportCategories?.[0]?.name || "",
                          imageUrl: facility.imageUrl || "",
                          region: getRegionFromCity(facility.city),
                          address: formatAddress(facility.address, facility.city),
                          sports: facility.sportCategories?.map(cat => cat.name) || [],
                          priceFrom: minPrice,
                          selectedSport: params.sport && params.sport !== "all" ? params.sport : undefined,
                          selectedDate: params.date || undefined,
                          selectedTime: params.time && params.time !== "any" ? params.time : undefined,
                          slotsAvailableToday: facility.availability?.slotsAvailableToday,
                          slotsForDate: facility.availability?.slotsForDate,
                          slotsForTimeRange: facility.availability?.slotsForTimeRange,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <div className="container mx-auto px-6 space-y-6 py-12">
          {/* Header */}
          <FacilitiesHeader 
            title={getPageTitle()} 
            subtitle={t("findAndBook")}
            totalCount={totalCount}
          />

          {/* Results */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 w-full">
            {/* Filters Sidebar - Desktop */}
            <div className="hidden lg:block">
              <EnhancedFacilitiesFilters {...filtersProps} />
                </div>

            <div className="flex-1 flex flex-col w-full gap-y-6">
              {/* Active Filters Chips */}
              <ActiveFiltersChips
                city={params.city}
                region={params.region}
                sport={params.sport}
                date={params.date}
                time={params.time}
                locationType={params.locationType}
                surface={params.surface}
                facilities={params.facilities}
              />

              {/* Results Header with Sort */}
              <FacilitiesResultsHeader
                totalCount={totalCount}
                hasFilters={hasFilters}
                filtersProps={filtersProps}
              />

              {facilityGridData.length > 0 ? (
                <FacilitiesGrid 
                  facilities={facilityGridData} 
                  hideRegion={!!(
                    (params.city && params.city !== "all") || 
                    (params.region && params.region !== "all")
                  )}
                />
              ) : (
                <FacilitiesEmptyState />
              )}

              {/* Pagination */}
              {facilityGridData.length > 0 && totalPages > 1 && (
                <div className="mt-8">
                  <PaginationClient
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
