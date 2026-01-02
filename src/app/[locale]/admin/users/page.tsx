import { prisma } from "@/lib/prisma";
import { UsersDataTable } from "@/modules/admin/components/data-table/users-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Ban, Star } from "lucide-react";

export default async function UsersPage() {
  // Fetch users with trust system data
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      trustLevel: true,
      weeklyBookingLimit: true,
      successfulBookings: true,
      activeStrikes: true,
      bookingBanUntil: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate stats
  const totalUsers = users.length;
  const bannedUsers = users.filter((u) => u.banned).length;
  const verifiedUsers = users.filter((u) => u.trustLevel >= 1).length;
  const trustedUsers = users.filter((u) => u.trustLevel >= 2).length;

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Verified", value: verifiedUsers, icon: UserCheck },
    { label: "Trusted", value: trustedUsers, icon: Star },
    { label: "Banned", value: bannedUsers, icon: Ban },
  ];

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage users, roles, trust levels, and permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <UsersDataTable data={users} />
    </div>
  );
}
