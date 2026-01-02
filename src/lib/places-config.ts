// Google Places API configuration
export const PLACES_CONFIG = {
  // API Key - set this in your environment variables
  API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
  
  // API endpoints
  TEXT_SEARCH_URL: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
  DETAILS_URL: 'https://maps.googleapis.com/maps/api/place/details/json',
  GEOCODE_URL: 'https://maps.googleapis.com/maps/api/geocode/json',
  
  // Default parameters
  DEFAULT_PARAMS: {
    region: 'si', // Bias results towards Slovenia
    language: 'sl', // Slovenian language
    components: 'country:si' // Restrict to Slovenia
  },
  
  // Rate limiting
  RATE_LIMIT: {
    maxRequests: 100, // per minute
    windowMs: 60 * 1000 // 1 minute
  },
  
  // Cache settings
  CACHE: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 // maximum cached results
  }
};

// Check if Google Places API is configured
export function isGooglePlacesConfigured(): boolean {
  return Boolean(PLACES_CONFIG.API_KEY);
}

// Get API key with fallback
export function getApiKey(): string | undefined {
  return PLACES_CONFIG.API_KEY;
}
