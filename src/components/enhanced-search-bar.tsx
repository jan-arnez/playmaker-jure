"use client";

import { Search, MapPin, Clock, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLocationDetection } from "@/hooks/use-location-detection";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

interface SearchResult {
  id: string;
  name: string;
  city: string;
  sport: string;
  type: 'facility' | 'city' | 'sport';
}

interface EnhancedSearchBarProps {
  onSearch: (query: string) => void;
  facilities: any[];
}

export function EnhancedSearchBar({ onSearch, facilities }: EnhancedSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { location } = useLocationDetection();

  // Create search results from facilities
  const searchFacilities = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search facilities
    facilities.forEach(facility => {
      if (facility.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: facility.id,
          name: facility.name,
          city: facility.city,
          sport: facility.sport,
          type: 'facility'
        });
      }
    });

    // Search cities
    const uniqueCities = [...new Set(facilities.map(f => f.city))];
    uniqueCities.forEach(city => {
      if (city.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `city-${city}`,
          name: city,
          city: city,
          sport: '',
          type: 'city'
        });
      }
    });

    // Search sports
    const uniqueSports = [...new Set(facilities.flatMap(f => f.sports || [f.sport]))];
    uniqueSports.forEach(sport => {
      if (sport.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `sport-${sport}`,
          name: sport,
          city: '',
          sport: sport,
          type: 'sport'
        });
      }
    });

    return results.slice(0, 8); // Limit results
  };

  const { query, setQuery, results, isLoading } = useDebouncedSearch(searchFacilities);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        } else {
          onSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearch(result.name);
  };

  const handleSearch = () => {
    onSearch(query);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-fill location if detected
  useEffect(() => {
    if (location?.city && !query) {
      setQuery(location.city);
    }
  }, [location, query]);

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          placeholder="Search facilities, cities, sports..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length > 0 || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className={`px-4 py-2 cursor-pointer hover:bg-muted transition-colors ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex items-center gap-3">
                      {result.type === 'facility' && <MapPin className="h-4 w-4 text-primary" />}
                      {result.type === 'city' && <MapPin className="h-4 w-4 text-blue-500" />}
                      {result.type === 'sport' && <Clock className="h-4 w-4 text-green-500" />}
                      
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        {result.type === 'facility' && (
                          <div className="text-sm text-muted-foreground">
                            {result.city} • {result.sport}
                          </div>
                        )}
                        {result.type === 'city' && (
                          <div className="text-sm text-muted-foreground">City</div>
                        )}
                        {result.type === 'sport' && (
                          <div className="text-sm text-muted-foreground">Sport</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
