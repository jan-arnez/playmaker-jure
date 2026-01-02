"use client";

import { useState, useEffect } from "react";
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  createdAt: string;
}

interface NotificationBellProps {
  initialUnreadCount?: number;
}

const typeIcons = {
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  action_required: <CheckCircle className="h-4 w-4 text-purple-500" />,
};

export function NotificationBell({ initialUnreadCount = 0 }: NotificationBellProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/admin/notifications?unreadOnly=true&limit=5");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount);
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleViewAll = () => {
    router.push("/admin/notifications");
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "markRead" }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleMarkRead(notification.id)}
              >
                {typeIcons[notification.type as keyof typeof typeIcons] || <Info className="h-4 w-4" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{notification.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="justify-center text-center cursor-pointer"
          onClick={handleViewAll}
        >
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
