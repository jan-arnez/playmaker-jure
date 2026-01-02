"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Navigation, Search, Loader2, Building2, X, Star, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Popular locations - top 5 cities in Slovenia
const POPULAR_LOCATIONS = [
  { id: "city-ljubljana", name: "Ljubljana", type: "city" as const, region: "Osrednja Slovenija" },
  { id: "city-maribor", name: "Maribor", type: "city" as const, region: "Podravska" },
  { id: "city-kranj", name: "Kranj", type: "city" as const, region: "Gorenjska" },
  { id: "city-celje", name: "Celje", type: "city" as const, region: "Savinjska" },
  { id: "city-koper", name: "Koper", type: "city" as const, region: "Obalno-kraška" },
];

// Region priority system based on population, tourism, economic activity, and sports facilities
const regionPriority = {
  "Osrednja Slovenija": 1,    // Ljubljana region - capital, highest priority
  "Gorenjska": 2,             // Tourism hub (Bled, Kranjska Gora)
  "Podravska": 3,             // Maribor region - second largest city
  "Savinjska": 4,             // Celje, Velenje - industrial centers
  "Obalno-kraška": 5,         // Coastal tourism (Koper, Piran)
  "Goriška": 6,               // Nova Gorica, tourism
  "Jugovzhodna Slovenija": 7, // Novo Mesto region
  "Zasavska": 8,               // Industrial region
  "Posavska": 9,               // Krško region
  "Primorsko-notranjska": 10,  // Postojna, tourism
  "Koroška": 11,              // Northern region
  "Pomurska": 12               // Northeastern region
};

// Slovenian regions with their main cities
const slovenianRegions = [
  { 
    name: "Gorenjska", 
    cities: [
      "Kranj", "Bled", "Jesenice", "Škofja Loka", "Kranjska Gora", "Radovljica", 
      "Tržič", "Žirovnica", "Bohinjska Bistrica", "Bohinj", "Mojstrana", "Rateče"
    ] 
  },
  { 
    name: "Goriška", 
    cities: [
      "Nova Gorica", "Ajdovščina", "Tolmin", "Bovec", "Kanal", "Kobarid", 
      "Šempeter pri Gorici", "Miren", "Renče", "Vipava"
    ] 
  },
  { 
    name: "Jugovzhodna Slovenija", 
    cities: [
      "Novo Mesto", "Krško", "Brežice", "Črnomelj", "Metlika", "Semič", 
      "Dolenjske Toplice", "Kočevje", "Ribnica", "Žužemberk"
    ] 
  },
  { 
    name: "Koroška", 
    cities: [
      "Ravne na Koroškem", "Dravograd", "Mežica", "Prevalje", "Vuzenica", 
      "Muta", "Radlje ob Dravi", "Slovenj Gradec", "Mislinja"
    ] 
  },
  { 
    name: "Obalno-kraška", 
    cities: [
      "Koper", "Piran", "Izola", "Sežana", "Portorož", "Ankaran", "Hrpelje-Kozina", 
      "Divača", "Komen", "Muggia"
    ] 
  },
  { 
    name: "Osrednja Slovenija", 
    cities: [
      "Ljubljana", "Kamnik", "Domžale", "Vrhnika", "Naklo", "Medvode", 
      "Škofja Loka", "Cerklje na Gorenjskem", "Grosuplje", "Ivančna Gorica", 
      "Litija", "Trzin", "Mengeš", "Šmartno pri Litiji"
    ] 
  },
  { 
    name: "Podravska", 
    cities: [
      "Maribor", "Ptuj", "Slovenj Gradec", "Murska Sobota", "Lenart", "Pesnica", 
      "Duplek", "Rače", "Starše", "Kidričevo", "Ormož", "Ljutomer", "Gornja Radgona"
    ] 
  },
  { 
    name: "Pomurska", 
    cities: [
      "Murska Sobota", "Lendava", "Gornja Radgona", "Radenci", "Beltinci", 
      "Turnišče", "Puconci", "Tišina", "Hodoš", "Moravske Toplice"
    ] 
  },
  { 
    name: "Posavska", 
    cities: [
      "Krško", "Brežice", "Sevnica", "Bistrica ob Sotli", "Radeče", "Kostanjevica na Krki", 
      "Leskovec", "Sveti Jurij ob Ščavnici"
    ] 
  },
  { 
    name: "Primorsko-notranjska", 
    cities: [
      "Postojna", "Ilirska Bistrica", "Cerknica", "Pivka", "Loška dolina", 
      "Bloke", "Loški Potok", "Hrpelje-Kozina", "Sežana"
    ] 
  },
  { 
    name: "Savinjska", 
    cities: [
      "Celje", "Velenje", "Slovenske Konjice", "Rogaška Slatina", "Laško", 
      "Rogaška Slatina", "Šmarje pri Jelšah", "Žalec", "Vojnik", "Šentjur", 
      "Braslovče", "Polzela", "Prebold", "Radeče"
    ] 
  },
  { 
    name: "Zasavska", 
    cities: [
      "Trbovlje", "Zagorje ob Savi", "Hrastnik", "Litija", "Radeče", "Laško", 
      "Sevnica", "Bistrica ob Sotli", "Rimske Toplice"
    ] 
  }
];

interface LocationOption {
  id: string;
  name: string;
  type: 'current' | 'region' | 'city';
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationPickerProps {
  value?: string;
  onLocationSelect: (location: LocationOption | null) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
}

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Local search function (fallback when Google Places API is not available)
async function searchPlaces(query: string): Promise<LocationOption[]> {
  if (!query.trim() || query.length < 2) return [];

  try {
    // Search through all Slovenian cities
    const allSlovenianCities = slovenianRegions.flatMap(region => 
      region.cities.map(city => ({
        id: `city-${city.toLowerCase().replace(/\s+/g, '-')}`,
        name: city,
        type: 'city' as const,
        region: region.name
      }))
    );

    // Filter cities that match the query with improved search
    const queryLower = query.toLowerCase().trim();
    const matchingCities = allSlovenianCities.filter(city => {
      const cityName = city.name.toLowerCase();
      const regionName = city.region?.toLowerCase() || '';
      
      // Exact match (highest priority)
      if (cityName === queryLower) return true;
      
      // Starts with query (high priority)
      if (cityName.startsWith(queryLower)) return true;
      
      // Contains query (medium priority)
      if (cityName.includes(queryLower)) return true;
      
      // Region contains query (lower priority)
      if (regionName.includes(queryLower)) return true;
      
      return false;
    });


    // Sort results by relevance
    const sortedCities = matchingCities.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact matches first
      if (aName === queryLower && bName !== queryLower) return -1;
      if (bName === queryLower && aName !== queryLower) return 1;
      
      // Starts with query
      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
      if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
      
      // Alphabetical order for same priority
      return aName.localeCompare(bName);
    });

    // Only return cities, no regions or places in search results
    return sortedCities.slice(0, 12);
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

export function LocationPicker({
  value = "",
  onLocationSelect,
  placeholder,
  className,
  showClearButton = true
}: LocationPickerProps) {
  const t = useTranslations("filters.location");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationOption | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  
  // Use provided placeholder or fall back to translation
  const displayPlaceholder = placeholder || t("selectLocation");

  // Handle clearing the selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLocationSelect(null);
  };

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingGeo(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            id: 'current-location',
            name: t("currentLocation"),
            type: 'current',
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
          setIsLoadingGeo(false);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setIsLoadingGeo(false);
        }
      );
    }
  }, [t]);

  // Search for places when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true);
      searchPlaces(debouncedQuery).then((results) => {
        setSuggestions(results);
        setIsLoading(false);
      });
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Get initial suggestions (regions and current location)
  const getInitialSuggestions = useCallback((): LocationOption[] => {
    const suggestions: LocationOption[] = [];

    // Add current location if available
    if (currentLocation) {
      suggestions.push(currentLocation);
    }

    // Add Slovenian regions sorted by priority (only show regions in initial state)
    const sortedRegions = slovenianRegions.sort((a, b) => {
      const priorityA = regionPriority[a.name as keyof typeof regionPriority] || 999;
      const priorityB = regionPriority[b.name as keyof typeof regionPriority] || 999;
      return priorityA - priorityB;
    });

    sortedRegions.forEach(region => {
      suggestions.push({
        id: `region-${region.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: region.name,
        type: 'region',
        region: region.name
      });
    });

    return suggestions;
  }, [currentLocation]);

  const handleSelect = (location: LocationOption) => {
    onLocationSelect(location);
    setOpen(false);
    setSearchQuery("");
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
  };

  const displaySuggestions = searchQuery.length >= 2 ? suggestions : getInitialSuggestions();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-14 w-full justify-start text-left font-medium rounded-full pl-10 pr-10 text-sm relative group",
            !value && "text-muted-foreground",
            className
          )}
        >
          <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{value || displayPlaceholder}</span>
          {showClearButton && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="absolute right-3 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" side="bottom" avoidCollisions={false}>
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={t("startTyping")}
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
              autoFocus={false}
              tabIndex={-1}
            />
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </div>
          <CommandList>
            <CommandEmpty>
              {searchQuery.length < 2 
                ? t("startTyping") 
                : t("noResults")
              }
            </CommandEmpty>
            
            {/* When searching - show search results */}
            {searchQuery.length >= 2 && (
            <CommandGroup>
                {suggestions.map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.name}
                  onSelect={() => handleSelect(location)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-auto data-[disabled]:opacity-100",
                      value === location.name && "bg-accent"
                    )}
                  >
                    <Building2 className="h-4 w-4 text-orange-500" />
                    <div className="flex flex-col flex-1">
                    <span className="font-medium">{location.name}</span>
                      {location.region && (
                      <span className="text-xs text-muted-foreground">
                        {location.region}
                      </span>
                    )}
                  </div>
                    {value === location.name && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Initial state - show organized sections */}
            {searchQuery.length < 2 && (
              <>
                {/* 1. Current Location - at the top */}
                {(currentLocation || isLoadingGeo) && (
                  <CommandGroup>
                    {isLoadingGeo ? (
                      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span>{t("currentLocation")}...</span>
                      </div>
                    ) : currentLocation && (
                      <CommandItem
                        value={currentLocation.name}
                        onSelect={() => handleSelect(currentLocation)}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-auto data-[disabled]:opacity-100",
                          value === currentLocation.name && "bg-accent"
                        )}
                      >
                        <Navigation className="h-4 w-4 text-blue-500" />
                        <span className="font-medium flex-1">{currentLocation.name}</span>
                        {value === currentLocation.name && <Check className="h-4 w-4 text-primary" />}
                      </CommandItem>
                    )}
                  </CommandGroup>
                )}

                {/* 2. Popular Locations */}
                <CommandGroup heading={
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Star className="h-3 w-3" />
                    {t("popularLocations")}
                  </div>
                }>
                  {POPULAR_LOCATIONS.map((location) => (
                    <CommandItem
                      key={location.id}
                      value={location.name}
                      onSelect={() => handleSelect(location)}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-auto data-[disabled]:opacity-100",
                        value === location.name && "bg-accent"
                      )}
                    >
                      <Building2 className="h-4 w-4 text-amber-500" />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{location.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {location.region}
                        </span>
                      </div>
                      {value === location.name && <Check className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* 3. All Regions */}
                <CommandGroup heading={
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Globe className="h-3 w-3" />
                    {t("allRegions")}
                  </div>
                }>
                  {getInitialSuggestions()
                    .filter(loc => loc.type === 'region')
                    .map((location) => (
                      <CommandItem
                        key={location.id}
                        value={location.name}
                        onSelect={() => handleSelect(location)}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-auto data-[disabled]:opacity-100",
                          value === location.name && "bg-accent"
                        )}
                      >
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="font-medium flex-1">{location.name}</span>
                        {value === location.name && <Check className="h-4 w-4 text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
