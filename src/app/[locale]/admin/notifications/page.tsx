import { prisma } from "@/lib/prisma";
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationsClient } from "@/modules/admin/components/notifications/notifications-client";

export default async function AdminNotificationsPage() {
  // Fetch initial notifications and stats
  const [notifications, stats] = await Promise.all([
    prisma.platformNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.platformNotification.groupBy({
      by: ["type"],
      _count: { id: true },
      where: { isResolved: false },
    }),
  ]);

  const unreadCount = await prisma.platformNotification.count({
    where: { isRead: false },
  });

  const unresolvedCount = await prisma.platformNotification.count({
    where: { isResolved: false },
  });

  // Get counts by type
  const countByType = {
    error: stats.find(s => s.type === "error")?._count.id || 0,
    warning: stats.find(s => s.type === "warning")?._count.id || 0,
    info: stats.find(s => s.type === "info")?._count.id || 0,
    action_required: stats.find(s => s.type === "action_required")?._count.id || 0,
  };

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Platform alerts, errors, and issues requiring attention
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card className={countByType.error > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{countByType.error}</div>
          </CardContent>
        </Card>
        <Card className={countByType.warning > 0 ? "border-amber-200 bg-amber-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{countByType.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByType.action_required}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client component for interactive list */}
      <NotificationsClient initialNotifications={notifications} />
    </div>
  );
}
