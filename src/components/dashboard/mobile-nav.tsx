"use client";

import { 
  Calendar, 
  Home, 
  Settings, 
  User as UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
    exact: true,
  },
  {
    title: "Bookings",
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

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) => {
    const normalizedPathname = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
    if (exact) {
      return normalizedPathname === href || normalizedPathname === `${href}/`;
    }
    return normalizedPathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px]",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                active && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                active && "text-primary"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
