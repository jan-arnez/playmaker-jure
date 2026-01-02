import { User } from "@/generated/prisma";

/**
 * Get user role for provider pages
 * 
 * Platform admin (User.role === "admin") uses User.role
 * Regular users use Member.role (owner/member)
 * 
 * @param user - User object from session
 * @param memberRole - Member.role from organization membership (if exists)
 * @returns User role string: "admin" | "owner" | "member" | ""
 */
export function getUserRole(
  user: { role?: string | null } | null | undefined,
  memberRole: string | null | undefined
): string {
  // Platform admin uses User.role
  if (user?.role === "admin") {
    return "admin";
  }
  
  // Regular users use Member.role
  return memberRole || "";
}

