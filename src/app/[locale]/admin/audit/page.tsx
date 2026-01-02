import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

export default async function AdminAuditPage() {
  // Check if the AdminAuditLog table exists by trying to query it
  let auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: unknown;
    ipAddress: string | null;
    createdAt: Date;
    admin: { id: string; name: string; email: string };
  }> = [];
  let totalLogs = 0;
  let tableExists = true;

  try {
    const result = await prisma.adminAuditLog.findMany({
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    auditLogs = result;
    totalLogs = await prisma.adminAuditLog.count();
  } catch {
    // Table doesn't exist yet, needs migration
    tableExists = false;
  }

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('ban')) return 'bg-red-100 text-red-700';
    if (action.includes('create') || action.includes('activate')) return 'bg-green-100 text-green-700';
    if (action.includes('update') || action.includes('confirm')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'users.ban': 'User Banned',
      'users.unban': 'User Unbanned',
      'users.resetStrikes': 'Strikes Reset',
      'users.updateTrust': 'Trust Updated',
      'users.delete': 'User Deleted',
      'facilities.activate': 'Facility Activated',
      'facilities.deactivate': 'Facility Deactivated',
      'facilities.maintenance': 'Maintenance Mode',
      'facilities.delete': 'Facility Deleted',
      'bookings.cancel': 'Booking Cancelled',
      'bookings.confirm': 'Booking Confirmed',
      'bookings.complete': 'Booking Completed',
      'organizations.update': 'Organization Updated',
      'organizations.delete': 'Organization Deleted',
      'settings.update': 'Settings Changed',
    };
    return labels[action] || action;
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'user': return User;
      case 'facility': return FileText;
      case 'booking': return Calendar;
      default: return FileText;
    }
  };

  if (!tableExists) {
    return (
      <div className="container space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground">
              Track all admin actions for accountability
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">Migration Required</CardTitle>
            <CardDescription>
              The audit log table needs to be created. Run the following command:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block bg-muted p-4 rounded-lg text-sm">
              npx prisma migrate dev --name add_admin_audit_log
            </code>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground">
              {totalLogs} total admin actions recorded
            </p>
          </div>
        </div>
      </div>

      {auditLogs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No admin actions recorded yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Actions will be logged here when admins make changes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log) => {
            const EntityIcon = getEntityIcon(log.entityType);
            return (
              <Card key={log.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <EntityIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionColor(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            on {log.entityType}
                          </span>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">{log.admin.name}</span>
                          <span className="text-muted-foreground"> ({log.admin.email})</span>
                        </p>
                        {Boolean(log.details) && typeof log.details === 'object' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(log.details).slice(0, 100)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      <p>{format(log.createdAt, "MMM dd, yyyy")}</p>
                      <p>{format(log.createdAt, "HH:mm:ss")}</p>
                      {log.ipAddress && (
                        <p className="text-xs">{log.ipAddress}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
