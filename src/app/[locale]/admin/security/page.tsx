import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Users, Activity, CheckCircle, XCircle } from "lucide-react";

export default async function AdminSecurityPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Fetch security metrics in parallel
  const [
    bannedUsers,
    usersWithStrikes,
    activeNoShows,
    recentBookings,
    recentCancellations,
    usersWithHighStrikes,
  ] = await Promise.all([
    // Banned users count
    prisma.user.count({ where: { banned: true } }),
    // Users with active strikes
    prisma.user.count({ where: { activeStrikes: { gt: 0 } } }),
    // Active no-show reports
    prisma.noShowReport.count({ where: { status: "active" } }),
    // Recent bookings (24h)
    prisma.booking.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
    // Recent cancellations (7 days)
    prisma.booking.count({ 
      where: { 
        status: "cancelled", 
        updatedAt: { gte: sevenDaysAgo } 
      } 
    }),
    // Users with 2+ strikes (high risk)
    prisma.user.findMany({
      where: { activeStrikes: { gte: 2 } },
      select: { id: true, name: true, email: true, activeStrikes: true, bookingBanUntil: true },
      orderBy: { activeStrikes: "desc" },
      take: 10,
    }),
  ]);

  // Call abuse patterns API to get pattern data
  let abusePatterns = { patterns: [], statistics: { totalPatterns: 0, highRiskPatterns: 0 } };
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/abuse-patterns?startDate=${sevenDaysAgo.toISOString()}&endDate=${now.toISOString()}`, {
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      abusePatterns = data.data || abusePatterns;
    }
  } catch (error) {
    console.error("Failed to fetch abuse patterns:", error);
  }

  const stats = [
    { label: "Banned Users", value: bannedUsers, icon: XCircle, color: "text-red-500" },
    { label: "Users with Strikes", value: usersWithStrikes, icon: AlertTriangle, color: "text-amber-500" },
    { label: "Active No-Shows", value: activeNoShows, icon: Users, color: "text-orange-500" },
    { label: "Bookings (24h)", value: recentBookings, icon: Activity, color: "text-blue-500" },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security events and suspicious activity
          </p>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Abuse Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Abuse Patterns (7 Days)
            </CardTitle>
            <CardDescription>
              {abusePatterns.statistics.totalPatterns} patterns detected, {abusePatterns.statistics.highRiskPatterns} high risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {abusePatterns.patterns.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>No abuse patterns detected</span>
              </div>
            ) : (
              <div className="space-y-3">
                {(abusePatterns.patterns as Array<{ pattern: string; severity: string; description: string }>).slice(0, 5).map((pattern, idx) => (
                  <div key={idx} className="flex items-start justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{pattern.pattern}</p>
                      <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    </div>
                    <Badge className={getSeverityColor(pattern.severity)}>
                      {pattern.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* High Risk Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              High Risk Users
            </CardTitle>
            <CardDescription>
              Users with 2+ active strikes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersWithHighStrikes.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>No high-risk users</span>
              </div>
            ) : (
              <div className="space-y-3">
                {usersWithHighStrikes.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{user.activeStrikes} strikes</Badge>
                      {user.bookingBanUntil && new Date(user.bookingBanUntil) > now && (
                        <Badge variant="outline" className="text-red-600">Banned</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Cancellations */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Platform Health Summary</CardTitle>
            <CardDescription>Overview of platform security metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Cancellation Rate (7d)</p>
                <p className="text-2xl font-bold">
                  {recentBookings > 0 ? ((recentCancellations / recentBookings) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Abuse Pattern Trend</p>
                <p className="text-2xl font-bold capitalize">
                  {abusePatterns.statistics.highRiskPatterns > 0 ? "⚠️ Alert" : "✅ Stable"}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">No-Show Rate</p>
                <p className="text-2xl font-bold">
                  {activeNoShows} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
