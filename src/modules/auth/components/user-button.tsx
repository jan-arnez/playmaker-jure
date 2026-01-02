"use client";

import type { User as BetterAuthUser } from "better-auth";
import { LogOut, MoreVertical, User as UserIcon, Settings, Shield, Crown, LayoutDashboard, Calendar } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
// Decoupled from sidebar components to avoid SidebarProvider requirement
import { useRouter, usePathname } from "@/i18n/navigation";
import { authClient } from "../lib/auth-client";

// Extended user type with role information
interface User extends BetterAuthUser {
  role?: string | null;
}

interface UserButtonProps {
  user: User;
  redirectOnSignOut?: string;
}

// Protected route prefixes - routes that require authentication
const PROTECTED_ROUTE_PREFIXES = ['/admin', '/provider', '/dashboard'];

export function UserButton({
  user,
  redirectOnSignOut,
}: UserButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine user role and permissions
  // Note: Role might not be available in client-side session, so we use type assertion
  const userRole = (user as any).role;
  const isAdmin = userRole === "admin";
  const isOwner = userRole === "owner";
  const isRegularUser = userRole === "user" || !userRole;

  // Determine smart redirect based on current page
  const getLogoutRedirect = () => {
    // If explicit redirect is provided, use it
    if (redirectOnSignOut) {
      return redirectOnSignOut;
    }
    
    // Check if current page is a protected route
    const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => 
      pathname.startsWith(prefix)
    );
    
    // If on protected route, redirect to home
    // Otherwise, stay on current page (refresh will handle session clear)
    return isProtectedRoute ? '/' : pathname;
  };

  const handleLogout = async () => {
    const redirectTo = getLogoutRedirect();
    
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(redirectTo);
          router.refresh();
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center rounded-md p-1 hover:bg-accent transition-colors">
          <div className="relative">
            <UserAvatar name={user.name} image={user.image} />
            {isOwner && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                title="Organization Owner"
              >
                <Crown className="h-2.5 w-2.5" />
              </Badge>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg z-[100]"
        side="bottom"
        align="end"
        sideOffset={4}
        collisionPadding={16}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <div className="relative">
              <UserAvatar name={user.name} image={user.image} />
              {isOwner && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                  title="Organization Owner"
                >
                  <Crown className="h-2.5 w-2.5" />
                </Badge>
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Role-based menu items */}
        {isAdmin && (
          <>
            <DropdownMenuItem
              onClick={() => router.push("/admin")}
              className="cursor-pointer"
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {isOwner && (
          <>
            <DropdownMenuItem
              onClick={() => router.push("/provider")}
              className="cursor-pointer"
            >
              <Crown className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {isRegularUser && (
          <>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard")}
              className="cursor-pointer"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Overview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/reservations")}
              className="cursor-pointer"
            >
              <Calendar className="mr-2 h-4 w-4" />
              My Reservations
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/profile")}
              className="cursor-pointer"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
