import { ArrowRight, Award, Clock, MapPin, Shield, Users } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navigation } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { FacilityCard } from "@/modules/platform/components/facility/facility-card";
import { SearchBar } from "@/modules/platform/components/search/search-bar";

interface HomePageProps {
  searchParams: Promise<{
    search?: string;
    city?: string;
    sport?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  // Await searchParams in Next.js 15
  const params = await searchParams;

  // Build search filters
  const whereClause: Record<string, unknown> = {};

  if (params.search) {
    whereClause.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.city) {
    whereClause.city = { contains: params.city, mode: "insensitive" };
  }

  if (params.sport) {
    whereClause.sport = { contains: params.sport, mode: "insensitive" };
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
    take: 20, // Limit to 20 facilities for performance
  });

  // Get unique cities and sports for filter
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
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6">
                <Award className="h-4 w-4 mr-2" />
                Slovenia's #1 Sports Facility Platform
              </Badge>

              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Find Your Perfect Sports Facility
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Discover and book premium sports facilities across Slovenia.
                From tennis courts to football fields, find your perfect match.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-12">
                <SearchBar
                  initialSearch={params.search || ""}
                  initialCity={params.city || "all"}
                  initialSport={params.sport || "all"}
                  cities={cities.map((c) => c.city)}
                  sports={sports
                    .map((s) => s.sport)
                    .filter((sport): sport is string => Boolean(sport))}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {facilities.length}+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Facilities
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Cities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-muted-foreground">Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4.8</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Choose Playmaker?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We make finding and booking sports facilities simple, fast, and
                reliable.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Instant Booking</h3>
                <p className="text-sm text-muted-foreground">
                  Book your favorite facilities in seconds with our streamlined
                  process.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Verified Facilities</h3>
                <p className="text-sm text-muted-foreground">
                  All facilities are verified and maintained to the highest
                  standards.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Community Driven</h3>
                <p className="text-sm text-muted-foreground">
                  Join thousands of sports enthusiasts who trust Playmaker.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Facilities Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  {params.search || params.city
                    ? `Found ${facilities.length} facilities`
                    : "Popular Facilities"}
                </h2>
                <p className="text-muted-foreground">
                  {params.search || params.city
                    ? "Here are the facilities matching your search"
                    : "Discover our most popular sports facilities"}
                </p>
              </div>
              <Button asChild>
                <Link href="/facilities">
                  View All Facilities
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            {facilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = "/";
                  }}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of sports enthusiasts who have already discovered
              their perfect facilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/facilities">Browse Facilities</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link href="/signup">Sign Up Free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
