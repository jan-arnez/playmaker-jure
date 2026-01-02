"use client";

import type { User } from "better-auth";
import { 
  Calendar, 
  Home, 
  Settings, 
  User as UserIcon,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Logo from "@/components/shared/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import { authClient } from "@/modules/auth/lib/auth-client";
import { useRouter } from "@/i18n/navigation";

interface DashboardSidebarProps {
  user: User;
}

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
    exact: true,
  },
  {
    title: "My Reservations",
    href: "/dashboard/reservations",
    icon: Calendar,
    exact: false,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: UserIcon,
    exact: false,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    exact: false,
  },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact: boolean) => {
    // Remove locale prefix for comparison
    const normalizedPathname = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
    if (exact) {
      return normalizedPathname === href || normalizedPathname === `${href}/`;
    }
    return normalizedPathname.startsWith(href);
  };

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/');
          router.refresh();
        },
      },
    });
  };

  return (
    <Sidebar variant="inset" className="border-r border-border/50 overflow-x-hidden">
      <SidebarHeader className="border-b border-border/50 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex items-center gap-2">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* User Info */}
        <div className="px-3 py-4 mb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-border/50">
          <div className="flex items-center gap-3">
            <UserAvatar 
              name={user.name} 
              image={user.image} 
              size="lg"
              className="ring-2 ring-primary/20"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <SidebarSeparator className="my-2" />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "transition-all duration-200",
                        active && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn(
                          "h-4 w-4 transition-colors",
                          active ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span>{item.title}</span>
                        {active && (
                          <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
