import slugify from "slugify";

/**
 * Generates a unique slug from a facility name
 * @param name - The facility name
 * @param existingSlugs - Array of existing slugs to check for uniqueness
 * @returns A unique slug
 */
export function generateFacilitySlug(
  name: string,
  existingSlugs: string[] = []
): string {
  // Generate base slug from name
  let baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
    locale: "sl", // Slovenian locale for proper character handling
  });

  // If slug is empty, use a fallback
  if (!baseSlug) {
    baseSlug = "facility";
  }

  // Check if slug already exists
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

