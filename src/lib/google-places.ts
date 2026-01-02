// Google Places API service
// This file handles Google Places API integration for location search

import { PLACES_CONFIG, isGooglePlacesConfigured } from './places-config';

interface PlaceResult {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface PlacesResponse {
  results: PlaceResult[];
  status: string;
}

// Slovenian regions mapping for better categorization
const slovenianRegions = {
  'Gorenjska': ['Kranj', 'Bled', 'Jesenice', 'Škofja Loka'],
  'Goriška': ['Nova Gorica', 'Ajdovščina', 'Tolmin', 'Bovec'],
  'Jugovzhodna Slovenija': ['Novo Mesto', 'Krško', 'Brežice', 'Črnomelj'],
  'Koroška': ['Ravne na Koroškem', 'Dravograd', 'Mežica', 'Prevalje'],
  'Obalno-kraška': ['Koper', 'Piran', 'Izola', 'Sežana'],
  'Osrednja Slovenija': ['Ljubljana', 'Kamnik', 'Domžale', 'Vrhnika'],
  'Podravska': ['Maribor', 'Ptuj', 'Slovenj Gradec', 'Murska Sobota'],
  'Pomurska': ['Murska Sobota', 'Lendava', 'Gornja Radgona', 'Radenci'],
  'Posavska': ['Krško', 'Brežice', 'Sevnica', 'Bistrica ob Sotli'],
  'Primorsko-notranjska': ['Postojna', 'Ilirska Bistrica', 'Cerknica', 'Pivka'],
  'Savinjska': ['Celje', 'Velenje', 'Slovenske Konjice', 'Rogaška Slatina'],
  'Zasavska': ['Trbovlje', 'Zagorje ob Savi', 'Hrastnik', 'Litija']
};

// Check if a place is in Slovenia
function isInSlovenia(place: PlaceResult): boolean {
  return place.address_components.some(component => 
    component.types.includes('country') && 
    component.short_name === 'SI'
  );
}

// Get Slovenian region for a place
function getSlovenianRegion(place: PlaceResult): string | null {
  const locality = place.address_components.find(component => 
    component.types.includes('locality')
  );
  
  if (!locality) return null;

  for (const [region, cities] of Object.entries(slovenianRegions)) {
    if (cities.some(city => 
      city.toLowerCase() === locality.long_name.toLowerCase()
    )) {
      return region;
    }
  }

  return null;
}

// Search places using Google Places API
export async function searchPlaces(
  query: string,
  apiKey?: string
): Promise<PlaceResult[]> {
  const key = apiKey || PLACES_CONFIG.API_KEY;
  
  if (!key || !isGooglePlacesConfigured()) {
    console.warn('Google Places API key not provided, using mock data');
    return getMockPlaces(query);
  }

  try {
    const params = new URLSearchParams({
      query: query,
      key: key,
      ...PLACES_CONFIG.DEFAULT_PARAMS
    });

    const response = await fetch(
      `${PLACES_CONFIG.TEXT_SEARCH_URL}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PlacesResponse = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // Filter and enhance results
    return data.results
      .filter(isInSlovenia)
      .map(place => ({
        ...place,
        region: getSlovenianRegion(place)
      }));
  } catch (error) {
    console.error('Google Places API error:', error);
    return getMockPlaces(query);
  }
}

// Mock data for development/testing
function getMockPlaces(query: string): PlaceResult[] {
  const mockPlaces: PlaceResult[] = [
    {
      place_id: 'mock-ljubljana',
      formatted_address: 'Ljubljana, Slovenia',
      name: 'Ljubljana',
      geometry: {
        location: { lat: 46.0569, lng: 14.5058 }
      },
      address_components: [
        { long_name: 'Ljubljana', short_name: 'Ljubljana', types: ['locality'] },
        { long_name: 'Slovenia', short_name: 'SI', types: ['country'] }
      ]
    },
    {
      place_id: 'mock-maribor',
      formatted_address: 'Maribor, Slovenia',
      name: 'Maribor',
      geometry: {
        location: { lat: 46.5547, lng: 15.6459 }
      },
      address_components: [
        { long_name: 'Maribor', short_name: 'Maribor', types: ['locality'] },
        { long_name: 'Slovenia', short_name: 'SI', types: ['country'] }
      ]
    },
    {
      place_id: 'mock-koper',
      formatted_address: 'Koper, Slovenia',
      name: 'Koper',
      geometry: {
        location: { lat: 45.5481, lng: 13.7302 }
      },
      address_components: [
        { long_name: 'Koper', short_name: 'Koper', types: ['locality'] },
        { long_name: 'Slovenia', short_name: 'SI', types: ['country'] }
      ]
    }
  ];

  return mockPlaces.filter(place => 
    place.name.toLowerCase().includes(query.toLowerCase()) ||
    place.formatted_address.toLowerCase().includes(query.toLowerCase())
  );
}

// Get place details
export async function getPlaceDetails(
  placeId: string,
  apiKey?: string
): Promise<PlaceResult | null> {
  if (!apiKey) {
    console.warn('Google Places API key not provided, using mock data');
    return getMockPlaceDetails(placeId);
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&` +
      `key=${apiKey}&` +
      `language=sl`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.result;
  } catch (error) {
    console.error('Google Places API error:', error);
    return getMockPlaceDetails(placeId);
  }
}

// Mock place details
function getMockPlaceDetails(placeId: string): PlaceResult | null {
  const mockPlaces = getMockPlaces('');
  return mockPlaces.find(place => place.place_id === placeId) || null;
}

// Get current location using browser geolocation
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

// Reverse geocoding to get address from coordinates
export async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey?: string
): Promise<string | null> {
  if (!apiKey) {
    console.warn('Google Places API key not provided, using mock data');
    return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` +
      `latlng=${lat},${lng}&` +
      `key=${apiKey}&` +
      `language=sl`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results.length) {
      return null;
    }

    return data.results[0].formatted_address;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
