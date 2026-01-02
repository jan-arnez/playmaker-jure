import { prisma } from "@/lib/prisma";
import { Clock, Users, Bell, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default async function AdminWaitlistPage() {
  // Fetch all waitlist entries with related data
  const waitlistEntries = await prisma.waitlist.findMany({
    include: {
      facility: {
        select: { name: true, city: true },
      },
      court: {
        select: { name: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Calculate stats
  const total = waitlistEntries.length;
  const waiting = waitlistEntries.filter(e => e.status === "waitlist").length;
  const notified = waitlistEntries.filter(e => e.status === "notified").length;
  const booked = waitlistEntries.filter(e => e.status === "booked").length;
  const conversionRate = total > 0 ? ((booked / total) * 100).toFixed(1) : "0";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waitlist":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Waiting</Badge>;
      case "notified":
        return <Badge className="bg-blue-600"><Bell className="h-3 w-3 mr-1" />Notified</Badge>;
      case "booked":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Booked</Badge>;
      case "canceled":
        return <Badge variant="secondary">Canceled</Badge>;
      case "expired":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Waitlist</h1>
          <p className="text-muted-foreground">
            Manage waitlist entries across the platform
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waiting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notified</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booked</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{booked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Waitlist Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {waitlistEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No waitlist entries found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Facility</th>
                    <th className="text-left py-3 px-4 font-medium">Court</th>
                    <th className="text-left py-3 px-4 font-medium">Requested Slot</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlistEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{entry.user?.name || entry.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{entry.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{entry.facility.name}</div>
                        <div className="text-xs text-muted-foreground">{entry.facility.city}</div>
                      </td>
                      <td className="py-3 px-4">{entry.court.name}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          {format(new Date(entry.startTime), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(entry.startTime), "HH:mm")} - {format(new Date(entry.endTime), "HH:mm")}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(entry.status)}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {format(new Date(entry.createdAt), "MMM d, HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
