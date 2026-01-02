"use client";

import { useState, useEffect } from "react";

interface LocationData {
  city: string;
  country: string;
  region: string;
}

export function useLocationDetection() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get location from IP
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }

        const data = await response.json();
        
        if (data.city && data.country) {
          setLocation({
            city: data.city,
            country: data.country,
            region: data.region || data.state || ''
          });
        }
      } catch (err) {
        console.warn('Location detection failed:', err);
        setError('Location detection failed');
        
        // Fallback to browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Use reverse geocoding with a free service
                const { latitude, longitude } = position.coords;
                const reverseResponse = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                
                if (reverseResponse.ok) {
                  const reverseData = await reverseResponse.json();
                  setLocation({
                    city: reverseData.city || reverseData.locality || '',
                    country: reverseData.countryName || '',
                    region: reverseData.principalSubdivision || ''
                  });
                }
              } catch (reverseErr) {
                console.warn('Reverse geocoding failed:', reverseErr);
              }
            },
            (geoError) => {
              console.warn('Geolocation failed:', geoError);
            },
            { timeout: 5000 }
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  return { location, isLoading, error };
}
