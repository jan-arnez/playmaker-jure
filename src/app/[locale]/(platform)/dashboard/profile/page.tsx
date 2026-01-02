import { Shield, Mail, Calendar, Award, Edit2, CheckCircle2, AlertCircle } from "lucide-react";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  // Fetch extended user data
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      trustLevel: true,
      successfulBookings: true,
      activeStrikes: true,
      weeklyBookingLimit: true,
    },
  });

  if (!userData) {
    return null;
  }

  // Safeguard: Force trust level to 0 if email is not verified (data consistency)
  const effectiveTrustLevel = userData.emailVerified ? userData.trustLevel : 0;

  const getTrustLevelInfo = (level: number) => {
    switch (level) {
      case 0:
        return { label: "Unverified", color: "text-muted-foreground", bg: "bg-muted" };
      case 1:
        return { label: "Verified", color: "text-blue-500", bg: "bg-blue-500/10" };
      case 2:
        return { label: "Trusted", color: "text-green-500", bg: "bg-green-500/10" };
      case 3:
        return { label: "Established", color: "text-purple-500", bg: "bg-purple-500/10" };
      default:
        return { label: "Unknown", color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const trustInfo = getTrustLevelInfo(effectiveTrustLevel);
  const memberSince = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(userData.createdAt);

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="My Profile"
        description="Manage your account information"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-6 md:p-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <UserAvatar
                name={userData.name}
                image={userData.image}
                size="lg"
                className="h-24 w-24 text-2xl ring-4 ring-primary/20"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h2 className="text-2xl font-bold">{userData.name}</h2>
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  {userData.email}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {/* Trust level badge - only show if trust level > 0 AND email is verified */}
                {effectiveTrustLevel > 0 && (
                  <Badge variant="outline" className={cn("gap-1.5", trustInfo.bg, trustInfo.color)}>
                    <Shield className="h-3 w-3" />
                    Trust Level {effectiveTrustLevel}
                  </Badge>
                )}
                {/* Email verification badge */}
                {userData.emailVerified ? (
                  <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-500">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1.5 bg-amber-500/10 text-amber-500 cursor-pointer hover:bg-amber-500/20">
                    <AlertCircle className="h-3 w-3" />
                    Verify Email
                  </Badge>
                )}
              </div>
            </div>

            <Button variant="outline" className="hidden md:flex">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userData.successfulBookings}</p>
                <p className="text-xs text-muted-foreground">Completed Bookings</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userData.weeklyBookingLimit}</p>
                <p className="text-xs text-muted-foreground">Weekly Limit</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                userData.activeStrikes > 0 ? "bg-red-500/10" : "bg-green-500/10"
              )}>
                <Shield className={cn(
                  "h-5 w-5",
                  userData.activeStrikes > 0 ? "text-red-500" : "text-green-500"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">{userData.activeStrikes}</p>
                <p className="text-xs text-muted-foreground">Active Strikes</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">{memberSince}</p>
                <p className="text-xs text-muted-foreground">Member Since</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <h3 className="font-semibold">Account Information</h3>
          </div>
          <div className="divide-y divide-border/50">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Full Name</p>
                <p className="text-sm text-muted-foreground">{userData.name}</p>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">{userData.email}</p>
              </div>
              <Button variant="ghost" size="sm">Change</Button>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">••••••••••••</p>
              </div>
              <Button variant="ghost" size="sm">Update</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
