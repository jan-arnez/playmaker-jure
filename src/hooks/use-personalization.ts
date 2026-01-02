"use client";

import { useState, useEffect } from "react";

interface UserPreferences {
  favoriteSports: string[];
  preferredLocation: string;
  lastSearched: string[];
}

const defaultPreferences: UserPreferences = {
  favoriteSports: [],
  preferredLocation: "",
  lastSearched: []
};

export function usePersonalization() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('playmaker-preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }
  }, []);

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem('playmaker-preferences', JSON.stringify(updated));
  };

  const addFavoriteSport = (sport: string) => {
    if (!preferences.favoriteSports.includes(sport)) {
      updatePreferences({
        favoriteSports: [...preferences.favoriteSports, sport]
      });
    }
  };

  const removeFavoriteSport = (sport: string) => {
    updatePreferences({
      favoriteSports: preferences.favoriteSports.filter(s => s !== sport)
    });
  };

  const setPreferredLocation = (location: string) => {
    updatePreferences({ preferredLocation: location });
  };

  const addSearchHistory = (search: string) => {
    const updatedHistory = [search, ...preferences.lastSearched.filter(s => s !== search)].slice(0, 5);
    updatePreferences({ lastSearched: updatedHistory });
  };

  const getPersonalizedRecommendations = (facilities: any[]) => {
    // Simple rule-based recommendations
    let recommendations = [...facilities];

    // Prioritize facilities in preferred location
    if (preferences.preferredLocation) {
      recommendations = recommendations.sort((a, b) => {
        const aMatch = a.city?.toLowerCase().includes(preferences.preferredLocation.toLowerCase());
        const bMatch = b.city?.toLowerCase().includes(preferences.preferredLocation.toLowerCase());
        return bMatch ? 1 : aMatch ? -1 : 0;
      });
    }

    // Prioritize favorite sports
    if (preferences.favoriteSports.length > 0) {
      recommendations = recommendations.sort((a, b) => {
        const aMatch = preferences.favoriteSports.some(sport => 
          a.sports?.includes(sport) || a.sport === sport
        );
        const bMatch = preferences.favoriteSports.some(sport => 
          b.sports?.includes(sport) || b.sport === sport
        );
        return bMatch ? 1 : aMatch ? -1 : 0;
      });
    }

    return recommendations;
  };

  return {
    preferences,
    updatePreferences,
    addFavoriteSport,
    removeFavoriteSport,
    setPreferredLocation,
    addSearchHistory,
    getPersonalizedRecommendations
  };
}
