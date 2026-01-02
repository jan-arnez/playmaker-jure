import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

// Verification code settings
const CODE_LENGTH = 6;
const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * Send verification code to user's email
 */
export async function sendVerificationCode(userId: string): Promise<{
  success: boolean;
  error?: string;
  cooldownRemaining?: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      verificationCode: true,
      verificationCodeExpiry: true,
      verificationAttempts: true,
    },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.emailVerified) {
    return { success: false, error: "Email is already verified" };
  }

  // Check cooldown (can only resend after 60 seconds)
  if (user.verificationCodeExpiry) {
    const expiryTime = new Date(user.verificationCodeExpiry);
    const codeCreatedAt = new Date(expiryTime.getTime() - CODE_EXPIRY_MINUTES * 60 * 1000);
    const timeSinceCreation = (Date.now() - codeCreatedAt.getTime()) / 1000;
    
    if (timeSinceCreation < RESEND_COOLDOWN_SECONDS) {
      const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceCreation);
      return {
        success: false,
        error: `Please wait ${remaining} seconds before requesting a new code`,
        cooldownRemaining: remaining,
      };
    }
  }

  // Generate new code
  const code = generateVerificationCode();
  const expiry = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // Update user with new code
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationCode: code,
      verificationCodeExpiry: expiry,
      verificationAttempts: 0, // Reset attempts on new code
    },
  });

  // Send email
  const emailResult = await sendVerificationEmail({
    to: user.email,
    code,
    userName: user.name,
  });

  if (!emailResult.success) {
    return { success: false, error: emailResult.error || "Failed to send email" };
  }

  return { success: true };
}

/**
 * Verify the code and update user status
 */
export async function verifyCode(userId: string, code: string): Promise<{
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      emailVerified: true,
      verificationCode: true,
      verificationCodeExpiry: true,
      verificationAttempts: true,
    },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.emailVerified) {
    return { success: false, error: "Email is already verified" };
  }

  if (!user.verificationCode || !user.verificationCodeExpiry) {
    return { success: false, error: "No verification code found. Please request a new one." };
  }

  // Check if user is locked out
  if (user.verificationAttempts >= MAX_ATTEMPTS) {
    return { 
      success: false, 
      error: "Too many failed attempts. Please request a new code.",
      attemptsRemaining: 0,
    };
  }

  // Check if code has expired
  if (new Date() > user.verificationCodeExpiry) {
    return { success: false, error: "Verification code has expired. Please request a new one." };
  }

  // Check if code matches
  if (user.verificationCode !== code) {
    const attempts = user.verificationAttempts + 1;
    await prisma.user.update({
      where: { id: userId },
      data: { verificationAttempts: attempts },
    });

    const remaining = MAX_ATTEMPTS - attempts;
    return {
      success: false,
      error: remaining > 0 
        ? `Invalid code. ${remaining} attempt(s) remaining.`
        : "Too many failed attempts. Please request a new code.",
      attemptsRemaining: remaining,
    };
  }

  // Code is correct! Update user to verified status
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      trustLevel: 1, // Promote to Level 1 (Verified)
      weeklyBookingLimit: 1, // Can now book 1 slot
      verificationCode: null,
      verificationCodeExpiry: null,
      verificationAttempts: 0,
    },
  });

  return { success: true };
}

/**
 * Check if user needs verification before booking
 */
export async function checkVerificationStatus(userId: string): Promise<{
  isVerified: boolean;
  canBook: boolean;
  reason?: string;
  trustLevel: number;
  weeklyBookingLimit: number;
  bookingBanUntil?: Date;
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
      isVerified: false,
      canBook: false,
      reason: "User not found",
      trustLevel: 0,
      weeklyBookingLimit: 0,
    };
  }

  // Check if user is banned
  if (user.banned) {
    return {
      isVerified: user.emailVerified,
      canBook: false,
      reason: "Your account has been suspended",
      trustLevel: user.trustLevel,
      weeklyBookingLimit: user.weeklyBookingLimit,
    };
  }

  // Check booking ban
  if (user.bookingBanUntil && user.bookingBanUntil > new Date()) {
    return {
      isVerified: user.emailVerified,
      canBook: false,
      reason: `You are banned from booking until ${user.bookingBanUntil.toLocaleDateString()}`,
      trustLevel: user.trustLevel,
      weeklyBookingLimit: user.weeklyBookingLimit,
      bookingBanUntil: user.bookingBanUntil,
    };
  }

  // Check email verification
  if (!user.emailVerified) {
    return {
      isVerified: false,
      canBook: false,
      reason: "Please verify your email to make bookings",
      trustLevel: 0,
      weeklyBookingLimit: 0,
    };
  }

  return {
    isVerified: true,
    canBook: true,
    trustLevel: user.trustLevel,
    weeklyBookingLimit: user.weeklyBookingLimit,
  };
}
