"use client";

import type { User } from "better-auth";
import {
  Building,
  Command,
  LayoutDashboard,
  UsersRound,
  MapPin,
  Calendar,
  Percent,
  BarChart3,
  Shield,
  Settings,
  ClipboardList,
  Clock,
  UserX,
  Megaphone,
  Bell,
  Grid3X3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { NavMain } from "@/modules/admin/components/sidebar/nav-main";
import { UserButton } from "@/modules/auth/components/user-button";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
}

export function AdminSidebar(props: AdminSidebarProps) {
  const { user, ...rest } = props;
  const t = useTranslations("AdminModule.adminSidebar");

  // Main navigation - Dashboard overview
  const mainNav = [
    {
      title: t("dashboard"),
      url: "/admin",
      icon: LayoutDashboard,
    },
  ];

  // Entity management - Core platform entities
  const entityNav = [
    {
      title: t("users"),
      url: "/admin/users",
      icon: UsersRound,
    },
    {
      title: t("organizations"),
      url: "/admin/organizations",
      icon: Building,
    },
    {
      title: t("facilities"),
      url: "/admin/facilities",
      icon: MapPin,
    },
    {
      title: t("bookings"),
      url: "/admin/bookings",
      icon: Calendar,
    },
    {
      title: t("promotions"),
      url: "/admin/promotions",
      icon: Percent,
    },
    {
      title: t("waitlist"),
      url: "/admin/waitlist",
      icon: Clock,
    },
    {
      title: t("noShows"),
      url: "/admin/no-shows",
      icon: UserX,
    },
    {
      title: "Courts Overview",
      url: "/admin/courts",
      icon: Grid3X3,
    },
  ];

  // Analytics & Reports
  const analyticsNav = [
    {
      title: t("analytics"),
      url: "/admin/analytics",
      icon: BarChart3,
    },
  ];

  // System - Security, Settings, Audit
  const systemNav = [
    {
      title: "Notifications",
      url: "/admin/notifications",
      icon: Bell,
    },
    {
      title: t("security"),
      url: "/admin/security",
      icon: Shield,
    },
    {
      title: t("auditLog"),
      url: "/admin/audit",
      icon: ClipboardList,
    },
    {
      title: t("content"),
      url: "/admin/content",
      icon: Megaphone,
    },
    {
      title: t("settings"),
      url: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar variant="inset" {...rest}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-lg">PlayMaker</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNav} label={t("groupMain")} />
        <SidebarSeparator />
        <NavMain items={entityNav} label={t("groupEntities")} />
        <SidebarSeparator />
        <NavMain items={analyticsNav} label={t("groupAnalytics")} />
        <SidebarSeparator />
        <NavMain items={systemNav} label={t("groupSystem")} />
      </SidebarContent>
      <SidebarFooter>
        <UserButton user={user} redirectOnSignOut="/admin/login" />
      </SidebarFooter>
    </Sidebar>
  );
}
