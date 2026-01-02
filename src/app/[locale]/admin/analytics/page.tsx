import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, MapPin, Calendar, TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, Percent } from "lucide-react";
import { AnalyticsCharts } from "@/modules/admin/components/analytics/analytics-charts";
import { ExportButton } from "@/modules/admin/components/analytics/export-button";
import { Decimal } from "@/generated/prisma/runtime/library";

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all metrics in parallel
  const [
    totalUsers,
    totalOrganizations,
    totalFacilities,
    totalBookings,
    newUsersWeek,
    newBookingsWeek,
    confirmedBookings,
    cancelledBookings,
    usersByDay,
    bookingsByDay,
    // Revenue data
    paidBookings,
    // Waitlist data
    totalWaitlist,
    waitlistNotified,
    waitlistBooked,
    // No-show data
    totalNoShows,
    activeNoShows,
    redeemedNoShows,
    // Geographic data
    bookingsByCity,
    // Promotion data
    totalPromotionUsage,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.facility.count(),
    prisma.booking.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.booking.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.booking.count({ where: { status: "cancelled" } }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    // Revenue - get bookings with prices
    prisma.booking.findMany({
      where: { paymentStatus: "paid", price: { not: null } },
      select: { price: true },
    }),
    // Waitlist counts
    prisma.waitlist.count(),
    prisma.waitlist.count({ where: { status: "notified" } }),
    prisma.waitlist.count({ where: { status: "booked" } }),
    // No-show counts
    prisma.noShowReport.count(),
    prisma.noShowReport.count({ where: { status: "active" } }),
    prisma.noShowReport.count({ where: { status: "redeemed" } }),
    // Bookings by city
    prisma.booking.findMany({
      where: { status: "confirmed" },
      select: { facility: { select: { city: true } } },
    }),
    // Promotion usage
    prisma.promotionUsage.count(),
  ]);

  // Calculate revenue
  const totalRevenue = paidBookings.reduce((sum, b) => {
    return sum + (b.price ? Number(b.price) : 0);
  }, 0);

  // Calculate waitlist conversion rate
  const waitlistConversionRate = totalWaitlist > 0 
    ? ((waitlistBooked / totalWaitlist) * 100).toFixed(1)
    : "0";

  // Aggregate bookings by city
  const cityData: Record<string, number> = {};
  bookingsByCity.forEach((b) => {
    const city = b.facility.city || "Unknown";
    cityData[city] = (cityData[city] || 0) + 1;
  });
  const topCities = Object.entries(cityData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Aggregate daily data for charts
  const dailyData: Record<string, { date: string; users: number; bookings: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    dailyData[dateStr] = { date: dateStr, users: 0, bookings: 0 };
  }
  
  usersByDay.forEach((user) => {
    const dateStr = user.createdAt.toISOString().split("T")[0];
    if (dailyData[dateStr]) dailyData[dateStr].users++;
  });
  
  bookingsByDay.forEach((booking) => {
    const dateStr = booking.createdAt.toISOString().split("T")[0];
    if (dailyData[dateStr]) dailyData[dateStr].bookings++;
  });

  const chartData = Object.values(dailyData);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, change: `+${newUsersWeek} this week`, positive: true },
    { label: "Bookings", value: totalBookings, icon: Calendar, change: `+${newBookingsWeek} this week`, positive: true },
    { label: "Revenue", value: `€${totalRevenue.toLocaleString()}`, icon: DollarSign, change: null },
    { label: "Facilities", value: totalFacilities, icon: MapPin, change: null },
  ];

  const bookingStatusData = [
    { name: "Confirmed", value: confirmedBookings, color: "#22c55e" },
    { name: "Cancelled", value: cancelledBookings, color: "#ef4444" },
    { name: "Pending", value: totalBookings - confirmedBookings - cancelledBookings, color: "#f59e0b" },
  ];

  const waitlistStatusData = [
    { name: "Waiting", value: totalWaitlist - waitlistNotified - waitlistBooked, color: "#3b82f6" },
    { name: "Notified", value: waitlistNotified, color: "#f59e0b" },
    { name: "Booked", value: waitlistBooked, color: "#22c55e" },
  ];

  const noShowStatusData = [
    { name: "Active", value: activeNoShows, color: "#ef4444" },
    { name: "Redeemed", value: redeemedNoShows, color: "#22c55e" },
    { name: "Expired", value: totalNoShows - activeNoShows - redeemedNoShows, color: "#6b7280" },
  ];

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Platform-wide analytics and insights
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
              {stat.change && (
                <p className={`text-xs flex items-center gap-1 ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                  {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waitlist Entries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWaitlist}</div>
            <p className="text-xs text-muted-foreground">
              {waitlistConversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNoShows}</div>
            <p className="text-xs text-muted-foreground">
              {activeNoShows} active strikes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotion Uses</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPromotionUsage}</div>
            <p className="text-xs text-muted-foreground">
              Total discounts applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              Active on platform
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <AnalyticsCharts 
        chartData={chartData} 
        bookingStatusData={bookingStatusData}
        waitlistStatusData={waitlistStatusData}
        noShowStatusData={noShowStatusData}
        topCities={topCities}
      />
    </div>
  );
}
