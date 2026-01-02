import { prisma } from "@/lib/prisma";

// Trust level constants
export const TRUST_LEVELS = {
  UNVERIFIED: 0,
  VERIFIED: 1,     // 1 booking allowed
  TRUSTED: 2,      // 3 bookings/week  
  ESTABLISHED: 3,  // 5 bookings/week
} as const;

export const WEEKLY_LIMITS = {
  [TRUST_LEVELS.UNVERIFIED]: 0,
  [TRUST_LEVELS.VERIFIED]: 1,
  [TRUST_LEVELS.TRUSTED]: 3,
  [TRUST_LEVELS.ESTABLISHED]: 5,
} as const;

// Penalty constants
const STRIKES_TO_REDEEM = 5; // Successful bookings needed to clear 1 strike
const STRIKE_EXPIRY_DAYS = 60; // Strikes expire after this many days
const BAN_DURATION_DAYS = 7; // Duration of booking ban

/**
 * Get the number of bookings user has made this week
 */
export async function getWeeklyBookingCount(userId: string): Promise<number> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const count = await prisma.booking.count({
    where: {
      userId,
      status: { in: ["pending", "confirmed"] },
      createdAt: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
  });

  return count;
}

/**
 * Check if user can make a new booking based on their trust level and weekly limit
 */
export async function canUserBook(userId: string): Promise<{
  canBook: boolean;
  reason?: string;
  weeklyCount: number;
  weeklyLimit: number;
  trustLevel: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      trustLevel: true,
      weeklyBookingLimit: true,
      bookingBanUntil: true,
      banned: true,
    },
  });

  if (!user) {
    return {
      canBook: false,
      reason: "User not found",
      weeklyCount: 0,
      weeklyLimit: 0,
      trustLevel: 0,
    };
  }

  // Check if banned
  if (user.banned) {
    return {
      canBook: false,
      reason: "Your account has been suspended",
      weeklyCount: 0,
      weeklyLimit: 0,
      trustLevel: user.trustLevel,
    };
  }

  // Check booking ban
  if (user.bookingBanUntil && user.bookingBanUntil > new Date()) {
    const banEnd = user.bookingBanUntil.toLocaleDateString();
    return {
      canBook: false,
      reason: `You are banned from booking until ${banEnd}`,
      weeklyCount: 0,
      weeklyLimit: user.weeklyBookingLimit,
      trustLevel: user.trustLevel,
    };
  }

  // Check email verification
  if (!user.emailVerified) {
    return {
      canBook: false,
      reason: "Please verify your email to make bookings",
      weeklyCount: 0,
      weeklyLimit: 0,
      trustLevel: 0,
    };
  }

  // Check weekly limit
  const weeklyCount = await getWeeklyBookingCount(userId);
  if (weeklyCount >= user.weeklyBookingLimit) {
    return {
      canBook: false,
      reason: `You've reached your weekly limit of ${user.weeklyBookingLimit} booking(s)`,
      weeklyCount,
      weeklyLimit: user.weeklyBookingLimit,
      trustLevel: user.trustLevel,
    };
  }

  return {
    canBook: true,
    weeklyCount,
    weeklyLimit: user.weeklyBookingLimit,
    trustLevel: user.trustLevel,
  };
}

/**
 * Report a no-show and apply penalties
 */
export async function reportNoShow(
  bookingId: string,
  reporterId: string,
  reason?: string
): Promise<{
  success: boolean;
  error?: string;
  penaltyApplied?: string;
}> {
  // Get booking with user info
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      noShowReport: true,
      facility: {
        include: {
          organization: {
            include: {
              members: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return { success: false, error: "Booking not found" };
  }

  // Check if already reported
  if (booking.noShowReport) {
    return { success: false, error: "This booking has already been reported" };
  }

  // Check 24-hour reporting window
  const slotEndTime = new Date(booking.endTime);
  const reportingDeadline = new Date(slotEndTime.getTime() + 24 * 60 * 60 * 1000);
  
  if (new Date() > reportingDeadline) {
    return { 
      success: false, 
      error: "Reporting window has expired. You can only report within 24 hours of the slot ending." 
    };
  }

  // Check if slot has actually ended
  if (new Date() < slotEndTime) {
    return {
      success: false,
      error: "You can only report a no-show after the booking time has passed",
    };
  }

  // Verify reporter is an owner/member of the facility's organization
  const isOrgMember = booking.facility.organization.members.some(
    m => m.userId === reporterId
  );
  if (!isOrgMember) {
    return { success: false, error: "You are not authorized to report no-shows for this facility" };
  }

  const user = booking.user;
  let penaltyApplied = "";

  // Apply penalty based on trust level
  if (user.trustLevel === TRUST_LEVELS.VERIFIED) {
    // Level 1: 7-day ban + cancel pending bookings
    await prisma.$transaction([
      // Create no-show report
      prisma.noShowReport.create({
        data: {
          bookingId,
          userId: user.id,
          reportedBy: reporterId,
          reason,
        },
      }),
      // Update user
      prisma.user.update({
        where: { id: user.id },
        data: {
          activeStrikes: user.activeStrikes + 1,
          lastStrikeAt: new Date(),
          bookingBanUntil: new Date(Date.now() + BAN_DURATION_DAYS * 24 * 60 * 60 * 1000),
        },
      }),
      // Cancel all pending bookings
      prisma.booking.updateMany({
        where: {
          userId: user.id,
          status: "pending",
          startTime: { gt: new Date() },
        },
        data: { status: "cancelled" },
      }),
    ]);
    penaltyApplied = "7-day booking ban applied, pending bookings cancelled";

  } else if (user.trustLevel === TRUST_LEVELS.TRUSTED) {
    // Level 2: Demote to Level 1, limit to 1 booking/week, cancel pending
    await prisma.$transaction([
      prisma.noShowReport.create({
        data: {
          bookingId,
          userId: user.id,
          reportedBy: reporterId,
          reason,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          trustLevel: TRUST_LEVELS.VERIFIED,
          weeklyBookingLimit: 1, // Reduced limit
          activeStrikes: user.activeStrikes + 1,
          lastStrikeAt: new Date(),
        },
      }),
      prisma.booking.updateMany({
        where: {
          userId: user.id,
          status: "pending",
          startTime: { gt: new Date() },
        },
        data: { status: "cancelled" },
      }),
    ]);
    penaltyApplied = "Demoted to Level 1, weekly limit reduced to 1, pending bookings cancelled";

  } else if (user.trustLevel === TRUST_LEVELS.ESTABLISHED) {
    // Level 3: Warning first, then demotion, then ban
    const recentStrikes = await prisma.noShowReport.count({
      where: {
        userId: user.id,
        status: "active",
        reportedAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    });

    if (recentStrikes === 0) {
      // 1st strike: Warning, reduce to 3 bookings/week (Level 2 limit)
      await prisma.$transaction([
        prisma.noShowReport.create({
          data: {
            bookingId,
            userId: user.id,
            reportedBy: reporterId,
            reason,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            weeklyBookingLimit: 3, // Reduced from 5 to 3
            activeStrikes: user.activeStrikes + 1,
            lastStrikeAt: new Date(),
          },
        }),
      ]);
      penaltyApplied = "Warning issued, weekly limit reduced to 3";

    } else if (recentStrikes === 1) {
      // 2nd strike: Demote to Level 2
      await prisma.$transaction([
        prisma.noShowReport.create({
          data: {
            bookingId,
            userId: user.id,
            reportedBy: reporterId,
            reason,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            trustLevel: TRUST_LEVELS.TRUSTED,
            weeklyBookingLimit: 3,
            activeStrikes: user.activeStrikes + 1,
            lastStrikeAt: new Date(),
          },
        }),
      ]);
      penaltyApplied = "Demoted to Level 2, weekly limit is 3";

    } else {
      // 3rd+ strike: 7-day ban
      await prisma.$transaction([
        prisma.noShowReport.create({
          data: {
            bookingId,
            userId: user.id,
            reportedBy: reporterId,
            reason,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            activeStrikes: user.activeStrikes + 1,
            lastStrikeAt: new Date(),
            bookingBanUntil: new Date(Date.now() + BAN_DURATION_DAYS * 24 * 60 * 60 * 1000),
          },
        }),
        prisma.booking.updateMany({
          where: {
            userId: user.id,
            status: "pending",
            startTime: { gt: new Date() },
          },
          data: { status: "cancelled" },
        }),
      ]);
      penaltyApplied = "7-day booking ban applied, pending bookings cancelled";
    }
  }

  return { success: true, penaltyApplied };
}

/**
 * Promote user to next trust level after successful booking
 * Called 2 hours after slot ends with no report
 */
export async function processBookingCompletion(bookingId: string): Promise<{
  promoted: boolean;
  newLevel?: number;
}> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      noShowReport: true,
    },
  });

  if (!booking) {
    return { promoted: false };
  }

  // If reported, don't promote
  if (booking.noShowReport) {
    return { promoted: false };
  }

  const user = booking.user;
  const newSuccessfulCount = user.successfulBookings + 1;

  // Check if user should be promoted
  let newLevel = user.trustLevel;
  let newLimit = user.weeklyBookingLimit;

  if (user.trustLevel === TRUST_LEVELS.VERIFIED && newSuccessfulCount >= 1) {
    // Promote from Level 1 to Level 2
    newLevel = TRUST_LEVELS.TRUSTED;
    newLimit = WEEKLY_LIMITS[TRUST_LEVELS.TRUSTED]; // 3
  } else if (user.trustLevel === TRUST_LEVELS.TRUSTED && newSuccessfulCount >= 3) {
    // Promote from Level 2 to Level 3
    newLevel = TRUST_LEVELS.ESTABLISHED;
    newLimit = WEEKLY_LIMITS[TRUST_LEVELS.ESTABLISHED]; // 5
  }

  // Check if any strikes can be redeemed (5 successful bookings per strike)
  let strikesToRedeem = 0;
  if (user.activeStrikes > 0) {
    const totalSuccessful = newSuccessfulCount;
    const alreadyRedeemed = Math.floor((user.successfulBookings) / STRIKES_TO_REDEEM);
    const nowCanRedeem = Math.floor(totalSuccessful / STRIKES_TO_REDEEM);
    strikesToRedeem = Math.min(nowCanRedeem - alreadyRedeemed, user.activeStrikes);
  }

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      successfulBookings: newSuccessfulCount,
      trustLevel: newLevel,
      weeklyBookingLimit: newLimit,
      activeStrikes: Math.max(0, user.activeStrikes - strikesToRedeem),
    },
  });

  // Mark redeemed strikes
  if (strikesToRedeem > 0) {
    const oldestActiveStrikes = await prisma.noShowReport.findMany({
      where: {
        userId: user.id,
        status: "active",
      },
      orderBy: { reportedAt: "asc" },
      take: strikesToRedeem,
    });

    await prisma.noShowReport.updateMany({
      where: {
        id: { in: oldestActiveStrikes.map(s => s.id) },
      },
      data: {
        status: "redeemed",
        redeemedAt: new Date(),
      },
    });
  }

  return {
    promoted: newLevel > user.trustLevel,
    newLevel,
  };
}

/**
 * Expire old strikes (called by cron job)
 * Strikes older than 60 days are expired
 */
export async function expireOldStrikes(): Promise<number> {
  const expiryDate = new Date(Date.now() - STRIKE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Find and expire old strikes
  const oldStrikes = await prisma.noShowReport.findMany({
    where: {
      status: "active",
      reportedAt: { lt: expiryDate },
    },
    select: { id: true, userId: true },
  });

  if (oldStrikes.length === 0) {
    return 0;
  }

  // Group by user to decrement their active strike count
  const userStrikeCounts = new Map<string, number>();
  for (const strike of oldStrikes) {
    userStrikeCounts.set(strike.userId, (userStrikeCounts.get(strike.userId) || 0) + 1);
  }

  // Update in transaction
  await prisma.$transaction([
    // Mark strikes as expired
    prisma.noShowReport.updateMany({
      where: { id: { in: oldStrikes.map(s => s.id) } },
      data: { status: "expired", expiredAt: new Date() },
    }),
    // Decrement user strike counts
    ...Array.from(userStrikeCounts.entries()).map(([userId, count]) =>
      prisma.user.update({
        where: { id: userId },
        data: { activeStrikes: { decrement: count } },
      })
    ),
  ]);

  return oldStrikes.length;
}
