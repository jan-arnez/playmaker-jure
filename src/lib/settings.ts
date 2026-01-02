import { prisma } from "@/lib/prisma";

/**
 * Get a single setting by key
 */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  try {
    const setting = await prisma.platformSettings.findUnique({
      where: { key },
    });
    return setting?.value as T | null;
  } catch {
    return null;
  }
}

/**
 * Get multiple settings by keys
 */
export async function getSettings(
  keys: string[]
): Promise<Record<string, unknown>> {
  try {
    const settings = await prisma.platformSettings.findMany({
      where: { key: { in: keys } },
    });
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, unknown>);
  } catch {
    return {};
  }
}

/**
 * Get all settings in a category
 */
export async function getSettingsByCategory(
  category: string
): Promise<Record<string, unknown>> {
  try {
    const settings = await prisma.platformSettings.findMany({
      where: { category },
    });
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, unknown>);
  } catch {
    return {};
  }
}

/**
 * Default settings values (used when no DB value exists)
 */
export const defaultSettings = {
  // General
  "general.platformName": "Playmaker",
  "general.defaultCurrency": "EUR",
  "general.platformFeePercent": 5,
  "general.supportEmail": "support@playmaker.com",
  
  // Trust System
  "trust.newUserTrustLevel": 0,
  "trust.strikesForBan": 3,
  "trust.banDurationDays": 30,
  "trust.strikeExpiryDays": 90,
  
  // Homepage
  "homepage.heroTitle": "Find and Book Sports Facilities",
  "homepage.heroSubtitle": "Discover the best sports facilities in your area",
  "homepage.whyChooseItems": [
    { icon: "check", title: "Easy Booking", description: "Book in seconds" },
    { icon: "shield", title: "Verified Venues", description: "All venues are verified" },
    { icon: "star", title: "Best Prices", description: "Competitive pricing" },
  ],
  "homepage.showStats": true,
  "homepage.showTestimonials": true,
  
  // SEO
  "seo.metaTitle": "Playmaker - Book Sports Facilities",
  "seo.metaDescription": "Find and book the best sports facilities near you",
  "seo.ogImage": "/og-image.jpg",
  
  // Email
  "email.fromName": "Playmaker",
  "email.fromEmail": "noreply@playmaker.com",
  "email.bookingConfirmationEnabled": true,
  "email.reminderEnabled": true,
  "email.reminderHoursBefore": 24,
};

/**
 * Get a setting with fallback to default
 */
export async function getSettingOrDefault<T>(key: string): Promise<T> {
  const value = await getSetting<T>(key);
  if (value !== null) return value;
  return (defaultSettings as Record<string, unknown>)[key] as T;
}
