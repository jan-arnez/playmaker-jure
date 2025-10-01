"use client";

import type { User } from "better-auth";
import { Building, Command, LayoutDashboard, UsersRound } from "lucide-react";
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

  const data = {
    navMain: [
      {
        title: t("dashboard"),
        url: "/admin",
        icon: LayoutDashboard,
      },
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
    ],
  };

  return (
    <Sidebar variant="inset" {...rest}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-xl">Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <UserButton user={user} redirectOnSignOut="/admin/login" />
      </SidebarFooter>
    </Sidebar>
  );
}
