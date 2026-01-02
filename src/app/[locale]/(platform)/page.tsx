import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/layout/footer";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { FacilityCard } from "@/modules/platform/components/facility/facility-card";
import { 
  LandingHero, 
  LandingStats, 
  LandingWhyChoose, 
  LandingCTA,
  HowItWorks,
  PlayerTestimonials,
  PopularSports,
} from "@/components/landing";
import { FreeFacilitiesTabs } from "@/components/free-facilities-tabs";
import { prisma } from "@/lib/prisma";
import { formatAddress } from "@/lib/address-formatting";
import { getRegionFromCity, getCitiesFromRegion, slovenianRegions } from "@/config/regions";
import { getTranslations } from "next-intl/server";

interface HomePageProps {
  searchParams: Promise<{
    search?: string;
    city?: string;
    sport?: string;
    date?: string;
    time?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  // Await searchParams in Next.js 15
  const params = await searchParams;
  const t = await getTranslations("landing.facilities");

  // Build search filters
  const whereClause: Record<string, unknown> = {};

  if (params.search) {
    whereClause.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.city) {
    const isRegion = slovenianRegions.some(region => 
      region.toLowerCase() === params.city?.toLowerCase()
    );
    
    if (isRegion) {
      const citiesInRegion = getCitiesFromRegion(params.city);
      if (citiesInRegion.length > 0) {
        whereClause.city = { in: citiesInRegion };
      }
    } else {
      whereClause.city = { contains: params.city, mode: "insensitive" };
    }
  }

  if (params.sport) {
    whereClause.sportCategories = {
      some: {
        name: { contains: params.sport, mode: "insensitive" }
      }
    };
  }

  // Fetch facilities from database
  const dbFacilities = await prisma.facility.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      description: true,
      imageUrl: true,
      images: true,
      organization: {
        select: {
          name: true,
          slug: true,
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
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  });

  // Map to the format expected by the component
  const facilities = dbFacilities.map((facility) => {
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
      slug: facility.slug,
      name: facility.name,
      city: facility.city,
      address: facility.address,
      sport: facility.sportCategories?.[0]?.name || "",
      sports: facility.sportCategories?.map(cat => cat.name) || [],
      imageUrl: facility.imageUrl || facility.images?.[0] || "",
      images: facility.images || [],
      description: facility.description || "",
      organization: {
        name: facility.organization.name,
        slug: facility.organization.slug || "",
      },
      bookings: facility.bookings,
      minPrice,
    };
  });

  // Get unique cities from database
  const dbCities = await prisma.facility.findMany({
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  const cities = dbCities.map(c => ({ city: c.city }));

  // Get unique sports from database
  const dbSports = await prisma.sportCategory.findMany({
    select: { name: true },
    distinct: ["name"],
    orderBy: { name: "asc" },
  });
  const sports = dbSports.map(s => ({ sport: s.name }));

  // Get real stats from database
  const [facilityCount, cityCount, bookingCount] = await Promise.all([
    prisma.facility.count(),
    prisma.facility.findMany({ select: { city: true }, distinct: ["city"] }).then(r => r.length),
    prisma.booking.count({ where: { status: "confirmed" } }),
  ]);

  // Check if user performed a search
  const isSearching = params.search || params.city || params.sport;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section with Search */}
        <LandingHero
          initialSearch={params.search || ""}
          initialCity={params.city || "all"}
          initialSport={params.sport || "all"}
          initialDate={params.date || ""}
          initialTime={params.time || ""}
          cities={cities.map((c) => c.city)}
          sports={sports
            .map((s) => s.sport)
            .filter((sport): sport is string => Boolean(sport))}
        />

        {/* Stats Bar */}
        <LandingStats 
          stats={{
            facilities: facilityCount,
            cities: cityCount,
            bookings: bookingCount,
          }}
        />

        {/* How It Works - Simple 3-step flow */}
        <HowItWorks />

        {/* Popular Sports Categories */}
        <PopularSports />

        {/* Popular Facilities Section */}
        <section id="facilities" className="py-16 bg-muted/20">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                  {isSearching
                    ? t("searchResultsTitle", { count: facilities.length })
                    : t("popularTitle")}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {isSearching
                    ? t("searchResultsSubtitle")
                    : t("popularSubtitle")}
                </p>
              </div>
              <Button asChild size="lg" className="rounded-full">
                <Link href="/facilities">
                  {t("viewAll")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            {facilities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {facilities.slice(0, 8).map((facility) => (
                    <FacilityCard
                      key={facility.id}
                      variant="landing"
                      data={{
                        id: facility.id,
                        slug: facility.slug || undefined,
                        title: facility.name,
                        location: `${facility.city}`,
                        description: "",
                        organization: facility.organization.name,
                        bookingCount: facility.bookings.length,
                        sport: facility.sport || "",
                        imageUrl: facility.imageUrl || facility.images?.[0] || "",
                        region: getRegionFromCity(facility.city),
                        address: formatAddress(facility.address, facility.city),
                        sports: facility.sports || [],
                        priceFrom: facility.minPrice || 0,
                      }}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  {t("notFoundTitle")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t("notFoundSubtitle")}
                </p>
                <Button variant="outline" asChild className="rounded-full">
                  <Link href="/">
                    {t("clearSearch")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Why Choose Playmaker */}
        <LandingWhyChoose />

        {/* Free Facilities Tabs */}
        <FreeFacilitiesTabs facilities={facilities} />

        {/* Player Testimonials */}
        <PlayerTestimonials />

        {/* Final CTA */}
        <LandingCTA />
      </main>

      <Footer />
    </div>
  );
}
