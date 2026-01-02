import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";

export interface RouteProtectionConfig {
  allowedRoles?: string[];
  redirectTo?: string;
  requireAuth?: boolean;
}

export class RouteProtection {
  /**
   * Check if user has access to a route based on their role
   */
  static async checkAccess(
    request: NextRequest,
    config: RouteProtectionConfig
  ): Promise<NextResponse | null> {
    const { allowedRoles, redirectTo, requireAuth = true } = config;
    
    // If no auth required, allow access
    if (!requireAuth) {
      return null;
    }

    try {
      const session = await getServerSession();
      const user = session?.user;

      // If no user and auth is required, redirect to login
      if (!user) {
        const url = new URL("/login", request.url);
        return NextResponse.redirect(url);
      }

      const userRole = (user as any).role;

      // If no specific roles required, allow access
      if (!allowedRoles || allowedRoles.length === 0) {
        return null;
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        const url = new URL(redirectTo || "/unauthorized", request.url);
        return NextResponse.redirect(url);
      }

      return null; // Access granted
    } catch (error) {
      console.error("Route protection error:", error);
      const url = new URL("/unauthorized", request.url);
      return NextResponse.redirect(url);
    }
  }

  /**
   * Get role-based redirect URL
   */
  static getRoleRedirectUrl(userRole: string, locale: string): string {
    switch (userRole) {
      case "admin":
        return `/${locale}/admin`;
      case "owner":
        return `/${locale}/provider`;
      case "user":
      default:
        return `/${locale}/dashboard/profile`;
    }
  }

  /**
   * Check if user should be redirected based on role
   */
  static shouldRedirect(userRole: string, currentPath: string): string | null {
    // Admin users should go to admin dashboard
    if (userRole === "admin" && !currentPath.includes("/admin")) {
      return "/admin";
    }

    // Owner users should go to provider dashboard
    if (userRole === "owner" && !currentPath.includes("/provider")) {
      return "/provider";
    }

    // Regular users can access dashboard routes
    if (userRole === "user" || !userRole) {
      return null; // Allow access to dashboard routes
    }

    return null;
  }
}
