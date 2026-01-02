import { 
  Building, 
  Users, 
  Calendar, 
  TrendingUp,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Link } from "@/i18n/navigation";

export default async function AdminDashboardPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch stats and recent activity
  const [
    userCount,
    organizationCount,
    facilityCount,
    bookingCount,
    newUsersWeek,
    newBookingsWeek,
    recentBookings,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.facility.count(),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.booking.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        startTime: true,
        status: true,
        user: { select: { name: true } },
        facility: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, change: `+${newUsersWeek} this week`, href: "/admin/users" },
    { label: "Organizations", value: organizationCount, icon: Building, href: "/admin/organizations" },
    { label: "Facilities", value: facilityCount, icon: MapPin, href: "/admin/facilities" },
    { label: "Bookings", value: bookingCount, icon: Calendar, change: `+${newBookingsWeek} this week`, href: "/admin/bookings" },
  ];

  return (
    <div className="container space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the PlayMaker Admin Panel
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              {stat.change && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest platform bookings</CardDescription>
            </div>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{booking.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.facility.name} • {format(booking.startTime, "MMM dd, HH:mm")}
                      </p>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>New Users</CardTitle>
              <CardDescription>Recently registered users</CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(user.createdAt, "MMM dd")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/admin/analytics">
            <Button variant="outline" size="sm">View Analytics</Button>
          </Link>
          <Link href="/admin/security">
            <Button variant="outline" size="sm">Security Dashboard</Button>
          </Link>
          <Link href="/admin/audit">
            <Button variant="outline" size="sm">Audit Log</Button>
          </Link>
          <Link href="/admin/content">
            <Button variant="outline" size="sm">Manage Content</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
