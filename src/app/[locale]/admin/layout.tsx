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

export default async function AdminLayout({ children }: PropsWithChildren) {
  const session = await getServerSession();
  const locale = await getLocale();

  const user = session?.user;

  if (!user) {
    redirect({ href: "/admin/login", locale });
    return;
  }

  if (user.role !== "admin") {
    redirect({ href: "/", locale });
    return;
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={session.user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
