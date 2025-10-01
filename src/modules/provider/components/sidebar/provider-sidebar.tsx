"use client";

import {
  BarChart3,
  Building2,
  Calendar,
  Home,
  Plus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProviderContext } from "@/context/provider-context";
import { cn } from "@/lib/utils";

interface ProviderSidebarProps {
  onNavigate?: () => void;
}

export function ProviderSidebar({ onNavigate }: ProviderSidebarProps) {
  const t = useTranslations("ProviderModule.sidebar");
  const pathname = usePathname();
  const { organization, userRole } = useProviderContext();

  const canCreateFacility = userRole === "owner" || userRole === "admin";

  const navigationItems = [
    {
      name: t("overview"),
      href: `/provider/${organization.slug}`,
      icon: Home,
      exact: true,
    },
    {
      name: t("facilities"),
      href: `/provider/${organization.slug}/facilities`,
      icon: Building2,
    },
    {
      name: t("bookings"),
      href: `/provider/${organization.slug}/bookings`,
      icon: Calendar,
    },
    {
      name: t("analytics"),
      href: `/provider/${organization.slug}/analytics`,
      icon: BarChart3,
    },
    {
      name: t("team"),
      href: `/provider/${organization.slug}/team`,
      icon: Users,
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      {/* Organization Header */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center space-x-3">
          {organization.logo ? (
            <Image
              src={organization.logo}
              alt={organization.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
            />
          ) : (
            <div className="h-8 w-8 bg-gray-200 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {organization.name}
            </h2>
            <p className="text-xs text-gray-500">
              {userRole === "owner"
                ? t("role.owner")
                : userRole === "admin"
                ? t("role.admin")
                : t("role.member")}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {canCreateFacility && (
        <div className="p-4 border-b">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={onNavigate}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("createFacility")}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive(item.href, item.exact)
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <div className="text-xs text-gray-500 text-center">
          {t("poweredBy")} Playmaker
        </div>
      </div>
    </div>
  );
}
