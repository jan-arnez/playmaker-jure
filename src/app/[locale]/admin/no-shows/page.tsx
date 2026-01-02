import { prisma } from "@/lib/prisma";
import { AlertTriangle, CheckCircle, Clock, XCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function AdminNoShowsPage() {
  // Simplified query to avoid potential hangs
  let noShowReports: Array<{
    id: string;
    userId: string;
    reportedBy: string;
    reportedAt: Date;
    reason: string | null;
    status: string;
    user: { id: string; name: string | null; email: string; activeStrikes: number; banned: boolean | null };
    reporter: { name: string | null; email: string };
    booking: { startTime: Date; facility: { name: string } | null; court: { name: string } | null } | null;
  }> = [];

  try {
    noShowReports = await prisma.noShowReport.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, activeStrikes: true, banned: true },
        },
        reporter: {
          select: { name: true, email: true },
        },
        booking: {
          select: {
            startTime: true,
            facility: { select: { name: true } },
            court: { select: { name: true } },
          },
        },
      },
      orderBy: { reportedAt: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Failed to fetch no-show reports:", error);
  }

  // Calculate stats
  const total = noShowReports.length;
  const active = noShowReports.filter(r => r.status === "active").length;
  const redeemed = noShowReports.filter(r => r.status === "redeemed").length;
  const expired = noShowReports.filter(r => r.status === "expired").length;

  // Get repeat offenders
  const userReports = noShowReports.reduce((acc, report) => {
    acc[report.userId] = (acc[report.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const repeatOffenders = Object.values(userReports).filter(count => count >= 2).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-600"><AlertTriangle className="h-3 w-3 mr-1" />Active Strike</Badge>;
      case "redeemed":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Redeemed</Badge>;
      case "expired":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-medium tracking-tight">No-Shows</h1>
          <p className="text-muted-foreground">
            Manage no-show reports and user penalties
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Strikes</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redeemed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Offenders</CardTitle>
            <User className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repeatOffenders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All No-Show Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {noShowReports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No no-show reports found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Booking</th>
                    <th className="text-left py-3 px-4 font-medium">Reported By</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {noShowReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium flex items-center gap-2">
                          {report.user?.name || "Unknown"}
                          {report.user?.banned && (
                            <Badge variant="destructive" className="text-xs">Banned</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{report.user?.email}</div>
                        <div className="text-xs text-amber-600">
                          {report.user?.activeStrikes || 0} active strike(s)
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{report.booking?.facility?.name || "Unknown Facility"}</div>
                        <div className="text-xs text-muted-foreground">
                          {report.booking?.court?.name || "Unknown Court"} • {report.booking ? format(new Date(report.booking.startTime), "MMM d, HH:mm") : "N/A"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs">{report.reporter?.name || report.reporter?.email}</div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(report.status)}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {format(new Date(report.reportedAt), "MMM d, yyyy")}
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
