"use client";

import {
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  Home,
  Settings,
  Users,
  Percent,
  CalendarCheck,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useProviderContext } from "@/context/provider-context";
import { cn } from "@/lib/utils";
import { authClient } from "@/modules/auth/lib/auth-client";
import { useRouter } from "@/i18n/navigation";

export function ProviderSidebar() {
  const t = useTranslations("ProviderModule.sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const { organization, userRole } = useProviderContext();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

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
      name: t("calendar"),
      href: `/provider/${organization.slug}/calendar`,
      icon: CalendarDays,
      subItems: [
        {
          name: t("calendarSubItems.allBookings"),
          href: `/provider/${organization.slug}/calendar?view=bookings`,
        },
        {
          name: t("calendarSubItems.calendarView"),
          href: `/provider/${organization.slug}/calendar?view=calendar`,
        },
      ],
    },
    {
      name: t("analytics"),
      href: `/provider/${organization.slug}/analytics`,
      icon: BarChart3,
    },
    {
      name: t("promotions"),
      href: `/provider/${organization.slug}/promotions`,
      icon: Percent,
    },
    {
      name: t("seasonalTerms"),
      href: `/provider/${organization.slug}/seasonal-terms`,
      icon: CalendarCheck,
    },
    {
      name: t("team"),
      href: `/provider/${organization.slug}/team`,
      icon: Users,
    },
    {
      name: t("settings"),
      href: `/provider/${organization.slug}/settings`,
      icon: Settings,
    },
  ];

  const isActive = (href: string, exact = false) => {
    // Remove locale from pathname if present (e.g., /en/provider/... -> /provider/...)
    // Match pattern: /{locale}/provider/... or /{locale}/provider/.../
    const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/)/, '') || pathname;
    
    if (exact) {
      // For exact match (Overview), check if pathname exactly matches the href
      return pathnameWithoutLocale === href || pathnameWithoutLocale === `${href}/`;
    }
    // For non-exact match, check if pathname starts with the href
    // This ensures /provider/org/facilities matches /provider/org/facilities but not /provider/org
    return pathnameWithoutLocale.startsWith(href + '/') || pathnameWithoutLocale === href;
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
      <div className="p-4 space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-3" />
          {t("logout")}
        </Button>
        <div className="text-xs text-gray-500 text-center">
          {t("poweredBy")} Playmaker
        </div>
      </div>
    </div>
  );
}
