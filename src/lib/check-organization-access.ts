import { prisma } from "@/lib/prisma";

/**
 * Check if user has access to an organization
 * 
 * Platform admin (User.role === "admin") has access to all organizations
 * Owner (Member.role === "owner") has access to their organization
 * Member (Member.role === "member") has limited access based on facility assignments
 * 
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param userRole - User.role from session (platform admin check)
 * @returns Object with hasAccess boolean and memberRole (if member exists)
 */
export async function checkOrganizationAccess(
  userId: string,
  organizationId: string,
  userRole: string | null | undefined
): Promise<{
  hasAccess: boolean;
  memberRole?: string;
  memberId?: string;
}> {
  // Platform admin has access to all organizations
  if (userRole === "admin") {
    return { hasAccess: true };
  }

  // Check if user is a member of the organization
  const member = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!member) {
    return { hasAccess: false };
  }

  return {
    hasAccess: true,
    memberRole: member.role,
    memberId: member.id,
  };
}

/**
 * Check if user can perform owner-level actions in an organization
 * 
 * Platform admin (User.role === "admin") can perform owner actions
 * Owner (Member.role === "owner") can perform owner actions
 * 
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param userRole - User.role from session (platform admin check)
 * @returns boolean
 */
export async function canPerformOwnerActions(
  userId: string,
  organizationId: string,
  userRole: string | null | undefined
): Promise<boolean> {
  // Platform admin can perform owner actions
  if (userRole === "admin") {
    return true;
  }

  // Check if user is owner of the organization
  const member = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
      role: "owner",
    },
  });

  return !!member;
}

