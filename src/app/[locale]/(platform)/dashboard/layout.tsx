import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { redirect } from "@/i18n/navigation";
import { getServerSession } from "@/modules/auth/lib/get-session";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const session = await getServerSession();
  const locale = await getLocale();

  const user = session?.user;

  // Route protection - redirect to home if not authenticated
  if (!user) {
    redirect({ href: "/", locale });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Navigation Header */}
      <Navigation />
      
      {/* Dashboard with Sidebar */}
      <div className="flex-1 flex">
        <SidebarProvider defaultOpen={true}>
          <DashboardSidebar user={user} />
          <SidebarInset className="bg-background flex-1">
            <div className="flex flex-1 flex-col min-h-full">
              {/* Dashboard Content */}
              <div className="flex-1 pb-20 md:pb-0">
                {children}
              </div>
              
              {/* Footer in content area */}
              <Footer />
            </div>
          </SidebarInset>
          <MobileNav />
        </SidebarProvider>
      </div>
    </div>
  );
}
