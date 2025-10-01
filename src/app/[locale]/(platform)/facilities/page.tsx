import { MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { FacilityCard } from "@/modules/platform/components/facility/facility-card";
import { SearchBar } from "@/modules/platform/components/search/search-bar";

interface FacilitiesPageProps {
  searchParams: {
    search?: string;
    city?: string;
    sport?: string;
  };
}

export default async function Facilities({
  searchParams,
}: FacilitiesPageProps) {
  // Build search filters
  const whereClause: Record<string, unknown> = {};

  if (searchParams.search) {
    whereClause.OR = [
      { name: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }

  if (searchParams.city && searchParams.city !== "all") {
    whereClause.city = { contains: searchParams.city, mode: "insensitive" };
  }

  if (searchParams.sport && searchParams.sport !== "all") {
    whereClause.sport = { contains: searchParams.sport, mode: "insensitive" };
  }

  // Fetch facilities with search filters
  const facilities = await prisma.facility.findMany({
    where: whereClause,
    include: {
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get unique cities and sports for filters
  const cities = await prisma.facility.findMany({
    select: {
      city: true,
    },
    distinct: ["city"],
    orderBy: {
      city: "asc",
    },
  });

  const sports = await prisma.facility.findMany({
    select: {
      sport: true,
    },
    distinct: ["sport"],
    orderBy: {
      sport: "asc",
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <div className="container mx-auto px-6 space-y-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">All Sports Facilities</h1>
            <p className="text-xl text-muted-foreground">
              Discover and book from our complete list of facilities
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-card border rounded-2xl p-6 mb-8">
            <SearchBar
              initialSearch={searchParams.search || ""}
              initialCity={searchParams.city || "all"}
              initialSport={searchParams.sport || "all"}
              cities={cities.map((c) => c.city)}
              sports={sports
                .map((s) => s.sport)
                .filter((sport): sport is string => Boolean(sport))}
            />
          </div>

          {/* Results */}
          <div className="flex gap-x-12 w-full">
            <div className="lg:block hidden w-[350px] flex-shrink-0">
              <div className="w-full bg-card border rounded-2xl sticky top-26 p-6">
                <h3 className="font-semibold mb-4">Filters</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      City
                    </div>
                    <div className="mt-2 space-y-2">
                      <Link
                        href="/facilities"
                        className={`block text-sm p-2 rounded ${
                          !searchParams.city || searchParams.city === "all"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          All Cities
                        </div>
                      </Link>
                      {cities.map((city) => (
                        <Link
                          key={city.city}
                          href={`/facilities?city=${encodeURIComponent(
                            city.city
                          )}`}
                          className={`block text-sm p-2 rounded ${
                            searchParams.city === city.city
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {city.city}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Sport
                    </div>
                    <div className="mt-2 space-y-2">
                      <Link
                        href="/facilities"
                        className={`block text-sm p-2 rounded ${
                          !searchParams.sport || searchParams.sport === "all"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          All Sports
                        </div>
                      </Link>
                      {sports.map((sport) => (
                        <Link
                          key={sport.sport}
                          href={`/facilities?sport=${encodeURIComponent(
                            sport.sport || ""
                          )}`}
                          className={`block text-sm p-2 rounded ${
                            searchParams.sport === sport.sport
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            {sport.sport}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col w-full gap-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {searchParams.search || searchParams.city
                    ? `Found ${facilities.length} facilities`
                    : `All ${facilities.length} facilities`}
                </h2>
              </div>

              {facilities.length > 0 ? (
                <div className="space-y-6">
                  {facilities.map((facility) => (
                    <FacilityCard
                      key={facility.id}
                      data={{
                        id: facility.id,
                        title: facility.name,
                        location: `${facility.city}, ${facility.address}`,
                        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
                        description: facility.description || "",
                        organization: facility.organization.name,
                        bookingCount: facility.bookings.length,
                        sport: facility.sport || "",
                        imageUrl: facility.imageUrl || "",
                      }}
                      variant="detailed"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">
                    No facilities found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search criteria
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/facilities">Clear Filters</Link>
                  </Button>
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
