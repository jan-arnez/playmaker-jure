/**
 * Utility functions for mapping sport names between Slovenian and English
 * Handles sport name variations for filtering and display
 */

/**
 * Maps Slovenian sport names to English equivalents
 * Used for filtering when users search with Slovenian names
 */
const slovenianToEnglish: Record<string, string> = {
  "tenis": "Tennis",
  "odbojka": "Volleyball",
  "večnamensko": "Multi-purpose",
  "plavanje": "Swimming",
  "košarka": "Basketball",
  "nogomet": "Football",
  "namizni tenis": "Table Tennis",
  "badminton": "Badminton",
  "padel": "Padel",
  "squash": "Squash",
  "pickleball": "Pickleball",
};

/**
 * Normalizes a sport name for matching (handles case, diacritics, and language variations)
 */
export function normalizeSportName(sport: string): string {
  if (!sport || typeof sport !== "string") {
    return "";
  }

  const normalized = sport.toLowerCase().trim();
  
  // First check if it's a Slovenian name and map to English
  if (slovenianToEnglish[normalized]) {
    return slovenianToEnglish[normalized].toLowerCase();
  }
  
  // Return normalized English name
  return normalized;
}

/**
 * Gets all possible sport name variations for a given sport name
 * Useful for flexible matching in database queries
 */
export function getSportNameVariations(sport: string): string[] {
  if (!sport || typeof sport !== "string") {
    return [];
  }

  const normalized = normalizeSportName(sport);
  const variations = new Set<string>();
  
  // Add the normalized version
  variations.add(normalized);
  
  // Add the original (normalized)
  variations.add(sport.toLowerCase().trim());
  
  // If it was a Slovenian name, add the English version
  const slovenianLower = sport.toLowerCase().trim();
  if (slovenianToEnglish[slovenianLower]) {
    variations.add(slovenianToEnglish[slovenianLower].toLowerCase());
  }
  
  // Add common variations
  const commonVariations: Record<string, string[]> = {
    "tennis": ["tenis", "tennis"],
    "volleyball": ["odbojka", "volleyball"],
    "multi-purpose": ["večnamensko", "multi-purpose", "multipurpose"],
    "swimming": ["plavanje", "swimming"],
    "basketball": ["košarka", "basketball"],
    "table tennis": ["namizni tenis", "table tennis", "ping pong"],
    "football": ["nogomet", "football", "soccer"],
  };
  
  if (commonVariations[normalized]) {
    commonVariations[normalized].forEach(v => variations.add(v.toLowerCase()));
  }
  
  return Array.from(variations);
}

