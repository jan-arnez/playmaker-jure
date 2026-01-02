import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { redirect } from "@/i18n/navigation";
import { AdminSidebar } from "@/modules/admin/components/sidebar/admin-sidebar";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { NotificationBell } from "@/modules/admin/components/notifications/notification-bell";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: PropsWithChildren) {
  const session = await getServerSession();
  const locale = await getLocale();

  const user = session?.user;

  if (!user) {
    redirect({ href: "/signin/admin", locale });
    return;
  }

  if (user.role !== "admin") {
    redirect({ href: "/signin/admin", locale });
    return;
  }

  // Get unread notification count for bell
  let unreadCount = 0;
  try {
    unreadCount = await prisma.platformNotification.count({
      where: { isRead: false },
    });
  } catch {
    // Table may not exist yet
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={session.user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell initialUnreadCount={unreadCount} />
          </div>
        </header>
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

