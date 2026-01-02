/**
 * Route Protection Test Utilities
 * 
 * This file contains utilities to test route protection scenarios
 * without requiring actual authentication.
 */

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const testUsers: Record<string, TestUser> = {
  admin: {
    id: "admin-1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin"
  },
  owner: {
    id: "owner-1", 
    name: "Organization Owner",
    email: "owner@example.com",
    role: "owner"
  },
  user: {
    id: "user-1",
    name: "Regular User", 
    email: "user@example.com",
    role: "user"
  }
};

export const testRoutes = {
  admin: ["/admin", "/admin/users", "/admin/settings"],
  owner: ["/provider", "/provider/settings", "/provider/facilities"],
  user: ["/dashboard/profile", "/dashboard/settings"],
  unauthorized: ["/admin", "/provider", "/dashboard"]
};

export function getExpectedRedirect(userRole: string, route: string): string | null {
  // Admin users should be redirected to admin dashboard
  if (userRole === "admin" && !route.includes("/admin")) {
    return "/admin";
  }
  
  // Owner users should be redirected to provider dashboard  
  if (userRole === "owner" && !route.includes("/provider")) {
    return "/provider";
  }
  
  // Regular users should be redirected to dashboard
  if (userRole === "user" && !route.includes("/dashboard")) {
    return "/dashboard/profile";
  }
  
  // Unauthorized access
  if (userRole === "user" && (route.includes("/admin") || route.includes("/provider"))) {
    return "/unauthorized";
  }
  
  if (userRole === "owner" && route.includes("/admin")) {
    return "/unauthorized";
  }
  
  return null; // Access allowed
}

export function validateRouteProtection(userRole: string, route: string): {
  allowed: boolean;
  redirectTo: string | null;
  reason: string;
} {
  const redirectTo = getExpectedRedirect(userRole, route);
  
  if (redirectTo === "/unauthorized") {
    return {
      allowed: false,
      redirectTo: "/unauthorized", 
      reason: "Insufficient permissions"
    };
  }
  
  if (redirectTo) {
    return {
      allowed: false,
      redirectTo,
      reason: "Role-based redirect required"
    };
  }
  
  return {
    allowed: true,
    redirectTo: null,
    reason: "Access granted"
  };
}
