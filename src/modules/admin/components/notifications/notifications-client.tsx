"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Trash2,
  Check,
  Eye,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

interface NotificationsClientProps {
  initialNotifications: Notification[];
}

const typeIcons = {
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  action_required: <CheckCircle className="h-4 w-4 text-purple-500" />,
};

const typeBadges = {
  error: <Badge variant="destructive">Error</Badge>,
  warning: <Badge className="bg-amber-500">Warning</Badge>,
  info: <Badge className="bg-blue-500">Info</Badge>,
  action_required: <Badge className="bg-purple-500">Action Required</Badge>,
};

const categoryColors: Record<string, string> = {
  email: "bg-pink-100 text-pink-700",
  cms: "bg-green-100 text-green-700",
  booking: "bg-blue-100 text-blue-700",
  payment: "bg-yellow-100 text-yellow-700",
  system: "bg-gray-100 text-gray-700",
  user: "bg-indigo-100 text-indigo-700",
  owner: "bg-orange-100 text-orange-700",
  facility: "bg-teal-100 text-teal-700",
};

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== "all" && n.type !== filterType) return false;
    if (filterCategory !== "all" && n.category !== filterCategory) return false;
    return true;
  });

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!res.ok) throw new Error("Failed to update");

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n;
          switch (action) {
            case "markRead":
              return { ...n, isRead: true };
            case "markUnread":
              return { ...n, isRead: false };
            case "resolve":
              return { ...n, isResolved: true, resolvedAt: new Date() };
            case "unresolve":
              return { ...n, isResolved: false, resolvedAt: null };
            default:
              return n;
          }
        })
      );

      toast.success("Notification updated");
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });

      if (!res.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResolved = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications?deleteResolved=true", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete resolved");

      setNotifications((prev) => prev.filter((n) => !n.isResolved));
      toast.success("Resolved notifications deleted");
    } catch {
      toast.error("Failed to delete resolved notifications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Notifications</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="action_required">Action Required</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="cms">CMS</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="facility">Facility</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={loading}>
            <Check className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeleteResolved} 
            disabled={loading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Resolved
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">All clear!</p>
            <p>No notifications to display</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${
                  !notification.isRead ? "bg-blue-50/50 border-blue-200" : ""
                } ${notification.isResolved ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {typeIcons[notification.type as keyof typeof typeIcons]}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{notification.title}</span>
                        {typeBadges[notification.type as keyof typeof typeBadges]}
                        <Badge 
                          variant="outline" 
                          className={categoryColors[notification.category] || ""}
                        >
                          {notification.category}
                        </Badge>
                        {notification.isResolved && (
                          <Badge variant="outline" className="bg-green-100 text-green-700">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                        <div className="text-xs bg-muted p-2 rounded font-mono">
                          {JSON.stringify(notification.metadata, null, 2)}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.createdAt), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {notification.isRead ? (
                        <DropdownMenuItem onClick={() => handleAction(notification.id, "markUnread")}>
                          <Eye className="h-4 w-4 mr-2" />
                          Mark Unread
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleAction(notification.id, "markRead")}>
                          <Check className="h-4 w-4 mr-2" />
                          Mark Read
                        </DropdownMenuItem>
                      )}
                      {notification.isResolved ? (
                        <DropdownMenuItem onClick={() => handleAction(notification.id, "unresolve")}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Unresolve
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleAction(notification.id, "resolve")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
