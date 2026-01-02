import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  Mail,
  Shield,
  Star,
  User,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

interface Props {
  params: Promise<{ userId: string }>;
}

const trustLevelLabels = {
  0: { label: "Unverified", color: "bg-gray-100 text-gray-800", icon: null },
  1: { label: "Verified", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  2: { label: "Trusted", color: "bg-green-100 text-green-800", icon: Shield },
  3: { label: "Established", color: "bg-purple-100 text-purple-800", icon: Star },
};

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          facility: { select: { id: true, name: true } },
          court: { select: { id: true, name: true } },
        },
      },
      noShowReports: {
        orderBy: { reportedAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              startTime: true,
              facility: { select: { name: true } },
            },
          },
        },
      },
      members: {
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
      _count: {
        select: {
          bookings: true,
          waitlistEntries: true,
          noShowReports: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const trustLevel = (user.trustLevel ?? 0) as 0 | 1 | 2 | 3;
  const trust = trustLevelLabels[trustLevel] || trustLevelLabels[0];
  const TrustIcon = trust.icon;

  return (
    <div className="container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium tracking-tight">{user.name}</h1>
            {user.banned && (
              <Badge variant="destructive">Banned</Badge>
            )}
            {user.role === "admin" && (
              <Badge className="bg-red-100 text-red-800">Admin</Badge>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {user.email}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trust Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {TrustIcon && <TrustIcon className="h-4 w-4" />}
              <Badge className={trust.color}>{trust.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Limit: {user.weeklyBookingLimit} bookings/week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.bookings}</div>
            <p className="text-xs text-muted-foreground">
              {user.successfulBookings} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Strikes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {user.activeStrikes > 0 && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-2xl font-bold">{user.activeStrikes}</span>
            </div>
            {user.lastStrikeAt && (
              <p className="text-xs text-muted-foreground">
                Last: {format(user.lastStrikeAt, "MMM dd, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">No-Shows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.noShowReports}</div>
            <p className="text-xs text-muted-foreground">Total reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Ban Status */}
      {user.banned && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Ban className="h-5 w-5" />
              User is Banned
            </CardTitle>
            <CardDescription className="text-red-700">
              {user.banReason || "No reason provided"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.banExpires ? (
              <p className="text-sm text-red-600">
                Expires: {format(user.banExpires, "MMMM dd, yyyy 'at' HH:mm")}
              </p>
            ) : (
              <p className="text-sm text-red-600">Permanent ban</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Ban Status */}
      {user.bookingBanUntil && new Date(user.bookingBanUntil) > new Date() && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Calendar className="h-5 w-5" />
              Booking Restricted
            </CardTitle>
            <CardDescription className="text-amber-700">
              Due to no-show reports, this user cannot book until{" "}
              {format(user.bookingBanUntil, "MMMM dd, yyyy")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Last 10 bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {user.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {user.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{booking.facility.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.court?.name || "N/A"} •{" "}
                        {format(booking.startTime, "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "confirmed"
                          ? "default"
                          : booking.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organizations */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Memberships</CardTitle>
            <CardDescription>Organizations this user belongs to</CardDescription>
          </CardHeader>
          <CardContent>
            {user.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No memberships</p>
            ) : (
              <div className="space-y-3">
                {user.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{member.organization.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {format(member.createdAt, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge>{member.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* No-Show Reports */}
      {user.noShowReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              No-Show Reports
            </CardTitle>
            <CardDescription>History of missed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.noShowReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {report.booking.facility.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(report.booking.startTime, "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{report.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported {format(report.reportedAt, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="font-mono text-xs">{user.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email Verified</dt>
              <dd>{user.emailVerified ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{format(user.createdAt, "MMMM dd, yyyy")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd>{format(user.updatedAt, "MMMM dd, yyyy")}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
