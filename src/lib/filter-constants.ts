/**
 * Shared filter constants used across filter components
 * Sports list with Slovenian slugs (used for database queries) and translation keys
 */

// Sports with Slovenian slugs for database and translation keys
export const SPORTS_LIST = [
  { slug: "tenis", translationKey: "tennis", icon: "/icons/tennis.svg" },
  { slug: "večnamensko", translationKey: "multiPurpose", icon: "/icons/tennis.svg", useCustomIcon: true },
  { slug: "badminton", translationKey: "badminton", icon: "/icons/badminton.svg" },
  { slug: "namizni tenis", translationKey: "tableTennis", icon: "/icons/table tennis.svg" },
  { slug: "odbojka", translationKey: "volleyball", icon: "/icons/volleyball.svg" },
  { slug: "padel", translationKey: "padel", icon: "/icons/padel.svg" },
  { slug: "plavanje", translationKey: "swimming", icon: "/icons/swimming.svg" },
  { slug: "nogomet", translationKey: "football", icon: "/icons/football.svg" },
  { slug: "squash", translationKey: "squash", icon: "/icons/squash.svg" },
  { slug: "košarka", translationKey: "basketball", icon: "/icons/basketball.svg" },
  { slug: "pickleball", translationKey: "pickleball", icon: "/icons/pickleball.svg" },
] as const;

// Time preset values (used for filter logic)
export const TIME_PRESETS = [
  { value: "any", translationKey: "anyTime" },
  { value: "morning", translationKey: "morning" },
  { value: "afternoon", translationKey: "afternoon" },
  { value: "evening", translationKey: "evening" },
] as const;

// Location type options
export const LOCATION_TYPES = [
  { value: "all", translationKey: "allTypes" },
  { value: "indoor", translationKey: "indoor" },
  { value: "outdoor", translationKey: "outdoor" },
] as const;

// Surface type options
export const SURFACE_TYPES = [
  { value: "clay", translationKey: "clay" },
  { value: "hard", translationKey: "hard" },
  { value: "grass", translationKey: "grass" },
  { value: "synthetic", translationKey: "synthetic" },
  { value: "wood", translationKey: "wood" },
  { value: "sand", translationKey: "sand" },
] as const;

// Facility amenities
export const FACILITY_AMENITIES = [
  { value: "parking", translationKey: "parking" },
  { value: "showers", translationKey: "showers" },
  { value: "lockers", translationKey: "lockers" },
  { value: "cafe", translationKey: "cafe" },
  { value: "lighting", translationKey: "lighting" },
] as const;

// Generate time options (07:00 to 23:00)
export const TIME_OPTIONS = Array.from({ length: 17 }, (_, i) => {
  const hour = (i + 7).toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

// Type exports for TypeScript
export type SportSlug = string;
export type TimePreset = typeof TIME_PRESETS[number]["value"];
export type LocationType = typeof LOCATION_TYPES[number]["value"];
export type SurfaceType = typeof SURFACE_TYPES[number]["value"];
export type AmenityType = typeof FACILITY_AMENITIES[number]["value"];

