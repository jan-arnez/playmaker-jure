import { Calendar, Heart, Clock, TrendingUp, ArrowRight, MapPin } from "lucide-react";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { FavoritesSection } from "@/components/dashboard/favorites-section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VerificationBanner } from "@/components/verification-banner";

export default async function DashboardPage() {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  // Fetch user's stats and verification status
  const [
    userData,
    totalBookings,
    upcomingBookings,
    completedBookings,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true, email: true },
    }),
    prisma.booking.count({
      where: { userId: user.id },
    }),
    prisma.booking.findMany({
      where: {
        userId: user.id,
        startTime: { gte: new Date() },
        status: { in: ["confirmed", "pending"] },
      },
      include: {
        facility: {
          select: {
            name: true,
            city: true,
            imageUrl: true,
            images: true,
            slug: true,
          },
        },
        court: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    prisma.booking.count({
      where: {
        userId: user.id,
        status: "completed",
      },
    }),
  ]);

  const firstName = user.name?.split(" ")[0] || "there";

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader 
        title={`Welcome back, ${firstName}!`}
        description="Here's an overview of your activity"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Email Verification Prompt */}
        {!userData?.emailVerified && (
          <VerificationBanner userEmail={userData?.email} />
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={totalBookings}
            description="All time"
            icon={Calendar}
            variant="primary"
          />
          <StatCard
            title="Upcoming"
            value={upcomingBookings.length}
            description="Scheduled sessions"
            icon={Clock}
            variant="success"
          />
          <StatCard
            title="Completed"
            value={completedBookings}
            description="Sessions played"
            icon={TrendingUp}
            variant="default"
          />
          <StatCard
            title="Favorites"
            value={0}
            description="Saved facilities"
            icon={Heart}
            variant="warning"
          />
        </div>

        {/* Upcoming Reservations */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Reservations</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reservations" className="text-primary">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="grid gap-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="group relative flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-transparent hover:border-primary/30 hover:shadow-md transition-all duration-300"
                >
                  {/* Facility Image */}
                  <div className="hidden sm:block relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {(booking.facility.imageUrl || booking.facility.images?.[0]) ? (
                      <img
                        src={booking.facility.imageUrl || booking.facility.images?.[0]}
                        alt={booking.facility.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary/50" />
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                          {booking.facility.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {booking.court?.name || "Court"} • {booking.facility.city}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("shrink-0", getStatusColor(booking.status))}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(booking.startTime)}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="hidden md:flex shrink-0"
                  >
                    <Link href={`/facilities/${booking.facility.slug || booking.facilityId}`}>
                      View Facility
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-border/50 bg-muted/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-center mb-1">No upcoming reservations</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Book your next session and it will appear here
              </p>
              <Button asChild>
                <Link href="/facilities">
                  Browse Facilities
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/facilities">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm">Find Facilities</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/reservations">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm">My Bookings</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/profile">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm">My Profile</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Favorites Section */}
        <FavoritesSection />
      </main>
    </div>
  );
}
