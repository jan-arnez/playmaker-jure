"use client";

import { Search, MapPin, Building2, Dumbbell, X, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FacilityResult {
  id: string;
  name: string;
  slug: string | null;
  city: string;
  sports: string[];
  matchedSport: string | null;
}

interface SearchResults {
  facilities: FacilityResult[];
  cities: string[];
  sports: string[];
}

interface LiveSearchProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onSearchComplete?: () => void;
}

export function LiveSearch({
  placeholder = "Search facilities, cities, sports...",
  className,
  inputClassName,
  autoFocus = false,
  onSearchComplete,
}: LiveSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ facilities: [], cities: [], sports: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate total results for keyboard navigation
  const totalResults = results.facilities.length + results.cities.length + results.sports.length;

  // Get flat list of all results for keyboard navigation
  const getFlatResults = useCallback(() => {
    const flat: { type: "facility" | "city" | "sport"; value: string; data?: FacilityResult }[] = [];
    
    results.facilities.forEach((f) => {
      flat.push({ type: "facility", value: f.name, data: f });
    });
    results.cities.forEach((city) => {
      flat.push({ type: "city", value: city });
    });
    results.sports.forEach((sport) => {
      flat.push({ type: "sport", value: sport });
    });
    
    return flat;
  }, [results]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ facilities: [], cities: [], sports: [] });
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setResults(data);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search error:", error);
          setResults({ facilities: [], cities: [], sports: [] });
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const flatResults = getFlatResults();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && flatResults[selectedIndex]) {
          handleSelectResult(flatResults[selectedIndex]);
        } else if (query.trim()) {
          navigateToSearch(query);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const navigateToSearch = (searchQuery: string) => {
    router.push(`/facilities?search=${encodeURIComponent(searchQuery.trim())}`);
    setIsOpen(false);
    setQuery("");
    onSearchComplete?.();
  };

  const handleSelectResult = (result: { type: "facility" | "city" | "sport"; value: string; data?: FacilityResult }) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery("");
    onSearchComplete?.();

    switch (result.type) {
      case "facility":
        if (result.data?.slug) {
          router.push(`/facilities/${result.data.slug}`);
        } else {
          router.push(`/facilities?search=${encodeURIComponent(result.value)}`);
        }
        break;
      case "city":
        router.push(`/facilities?city=${encodeURIComponent(result.value)}`);
        break;
      case "sport":
        router.push(`/facilities?sport=${encodeURIComponent(result.value)}`);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus with preventScroll to avoid page jumping
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [autoFocus]);

  // Calculate selected index position for each group
  const getGroupSelectedIndex = (type: "facility" | "city" | "sport") => {
    const flatResults = getFlatResults();
    if (selectedIndex < 0) return -1;

    const selected = flatResults[selectedIndex];
    if (!selected || selected.type !== type) return -1;

    // Find local index within the group
    let count = 0;
    for (let i = 0; i <= selectedIndex; i++) {
      if (flatResults[i].type === type) {
        count++;
      }
    }
    return count - 1;
  };

  const hasResults = totalResults > 0;

  return (
    <div className={cn("relative w-full", className)} ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className={cn("pl-10 pr-10 bg-muted/50 border-muted", inputClassName)}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto bg-background border border-border rounded-xl shadow-xl">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {/* Facilities */}
              {results.facilities.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                    Facilities
                  </div>
                  {results.facilities.map((facility, index) => {
                    const isSelected = getGroupSelectedIndex("facility") === index;
                    return (
                      <div
                        key={facility.id}
                        className={cn(
                          "px-3 py-2.5 cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-muted/70"
                        )}
                        onClick={() => handleSelectResult({ type: "facility", value: facility.name, data: facility })}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{facility.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {facility.city}
                              {facility.sports.length > 0 && (
                                <>
                                  {" • "}
                                  {facility.sports.length === 1 ? (
                                    facility.sports[0]
                                  ) : facility.sports.length === 2 ? (
                                    `${facility.sports[0]} and ${facility.sports[1]}`
                                  ) : (
                                    `${facility.sports[0]} and ${facility.sports.length - 1} other sports`
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-emerald-100 text-emerald-700">
                            Facility
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cities */}
              {results.cities.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                    Cities
                  </div>
                  {results.cities.map((city, index) => {
                    const isSelected = getGroupSelectedIndex("city") === index;
                    return (
                      <div
                        key={`city-${city}`}
                        className={cn(
                          "px-3 py-2.5 cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-muted/70"
                        )}
                        onClick={() => handleSelectResult({ type: "city", value: city })}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{city}</div>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-blue-100 text-blue-700">
                            City
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sports */}
              {results.sports.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                    Sports
                  </div>
                  {results.sports.map((sport, index) => {
                    const isSelected = getGroupSelectedIndex("sport") === index;
                    return (
                      <div
                        key={`sport-${sport}`}
                        className={cn(
                          "px-3 py-2.5 cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-muted/70"
                        )}
                        onClick={() => handleSelectResult({ type: "sport", value: sport })}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                            <Dumbbell className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{sport}</div>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-700">
                            Sport
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No results found for "<span className="font-medium text-foreground">{query}</span>"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
