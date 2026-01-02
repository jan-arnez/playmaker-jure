/**
 * Utility functions for formatting addresses
 */

/**
 * Removes post numbers (like "1000", "6000") from addresses
 * Formats address as: "Street Address, City - District" (if district exists)
 * Example: "Ulica heroja Staneta 1, 1000 Ljubljana" -> "Ulica heroja Staneta 1, Ljubljana"
 * Example: "Regentova 47, 1000 Ljubljana - Dravlje" -> "Regentova 47, Ljubljana - Dravlje"
 */
export function formatAddress(address: string, city: string): string {
  if (!address) return city;

  // Remove post numbers (4-digit numbers at the start, typically followed by city name)
  // Pattern: matches "1000", "6000", etc. followed by optional space and city name
  let formattedAddress = address
    .replace(/^\s*(\d{4})\s+/i, "") // Remove post number at start
    .replace(/,\s*(\d{4})\s+/g, ", ") // Remove post number after comma
    .trim();

  // If address already contains city, don't add it again
  // Check if city name is already in the address (case-insensitive)
  const cityLower = city.toLowerCase();
  const addressLower = formattedAddress.toLowerCase();

  if (addressLower.includes(cityLower)) {
    return formattedAddress;
  }

  // Otherwise, append city
  return `${formattedAddress}, ${city}`;
}

