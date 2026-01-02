import { prisma } from "@/lib/prisma";

/**
 * Get accessible facilities for a user in an organization
 * 
 * SECURITY NOTE: Role definitions
 * - "owner" (Member.role): Organization owner - sees all facilities in their organization only
 * - "admin" (Member.role): This role should NOT be used in Member model. Only "owner" and "member" are valid.
 * - "admin" (User.role): Platform admin - sees ALL facilities in ALL organizations (platform owner only)
 * - "member" (Member.role): Receptor - sees only facilities assigned via FacilityMember
 * 
 * IMPORTANT: The "admin" role in this function refers to platform admin (User.role === "admin"),
 * NOT organization admin (Member.role === "admin"). Organization admins should not exist.
 */
export async function getAccessibleFacilities(
  userId: string,
  organizationId: string,
  userRole: string
): Promise<string[]> {
  // Admin sees all facilities in ALL organizations (for platform admin)
  if (userRole === "admin") {
    const facilities = await prisma.facility.findMany({
      select: {
        id: true,
      },
    });
    return facilities.map((f) => f.id);
  }

  // Owner sees all facilities in their organization (only their own organization)
  if (userRole === "owner") {
    const facilities = await prisma.facility.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
      },
    });
    return facilities.map((f) => f.id);
  }

  // Member: get facilities from FacilityMember
  const member = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
      role: userRole,
    },
    include: {
      facilityMembers: {
        include: {
          facility: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!member) {
    return [];
  }

  return member.facilityMembers.map((fm) => fm.facility.id);
}

/**
 * Get accessible facilities with full data for a user in an organization
 * - Owner: all facilities in their organization (only their own organization)
 * - Admin: all facilities in ALL organizations (for platform admin)
 * - Member: only facilities assigned via FacilityMember
 */
export async function getAccessibleFacilitiesWithData(
  userId: string,
  organizationId: string,
  userRole: string
) {
  // Admin sees all facilities in ALL organizations (for platform admin)
  if (userRole === "admin") {
    return await prisma.facility.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Owner sees all facilities in their organization (only their own organization)
  if (userRole === "owner") {
    return await prisma.facility.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Member: get facilities from FacilityMember
  const member = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
      role: userRole,
    },
    include: {
      facilityMembers: {
        include: {
          facility: true,
        },
      },
    },
  });

  if (!member) {
    return [];
  }

  return member.facilityMembers.map((fm) => fm.facility);
}

/**
 * Check if user has access to a specific facility
 * Returns detailed access information
 */
export async function checkFacilityAccess(
  userId: string,
  facilityId: string,
  organizationId: string,
  userRole: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  // Admin has access to all facilities in ALL organizations (for platform admin)
  if (userRole === "admin") {
    const facility = await prisma.facility.findUnique({
      where: {
        id: facilityId,
      },
    });
    if (!facility) {
      return {
        hasAccess: false,
        reason: "Facility not found",
      };
    }
    return { hasAccess: true };
  }

  // Owner: verify the facility belongs to their organization
  if (userRole === "owner") {
    const facility = await prisma.facility.findFirst({
      where: {
        id: facilityId,
        organizationId,
      },
    });

    if (!facility) {
      return {
        hasAccess: false,
        reason: "Facility not found in this organization",
      };
    }
    return { hasAccess: true };
  }

  // Member: check if facility is assigned via FacilityMember
  const member = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
      role: userRole,
    },
    include: {
      facilityMembers: {
        where: {
          facilityId,
        },
      },
    },
  });

  if (!member) {
    return {
      hasAccess: false,
      reason: "User is not a member of this organization",
    };
  }

  if (member.facilityMembers.length === 0) {
    return {
      hasAccess: false,
      reason: "Facility not assigned to this member",
    };
  }

  return { hasAccess: true };
}

/**
 * Quick boolean check if user has access to a facility
 */
export async function hasFacilityAccess(
  userId: string,
  facilityId: string,
  organizationId: string,
  userRole: string
): Promise<boolean> {
  const result = await checkFacilityAccess(
    userId,
    facilityId,
    organizationId,
    userRole
  );
  return result.hasAccess;
}

/**
 * Get all facilities assigned to a specific member
 */
export async function getMemberFacilities(memberId: string) {
  const member = await prisma.member.findUnique({
    where: {
      id: memberId,
    },
    include: {
      facilityMembers: {
        include: {
          facility: true,
        },
      },
    },
  });

  if (!member) {
    return [];
  }

  return member.facilityMembers.map((fm) => fm.facility);
}

/**
 * Get member record for a user in an organization
 * Helper function to get member with role
 */
export async function getMember(
  userId: string,
  organizationId: string
) {
  return await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
    },
  });
}

