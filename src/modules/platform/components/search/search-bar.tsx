"use client";

import { MapPin, Search, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchBarProps {
  initialSearch: string;
  initialCity: string;
  initialSport: string;
  cities: string[];
  sports: string[];
}

export function SearchBar({
  initialSearch,
  initialCity,
  initialSport,
  cities,
  sports,
}: SearchBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [city, setCity] = useState(initialCity);
  const [sport, setSport] = useState(initialSport);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (city && city !== "all") {
      params.set("city", city);
    }

    if (sport && sport !== "all") {
      params.set("sport", sport);
    }

    const queryString = params.toString();
    router.push(`/facilities?${queryString}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search facilities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 h-12 text-lg"
        />
      </div>

      <div className="sm:w-48 relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="pl-10 h-12">
            <SelectValue placeholder="All Cities">
              {city === "all" ? "All Cities" : city}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((cityName) => (
              <SelectItem key={cityName} value={cityName}>
                {cityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="sm:w-48 relative">
        <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="pl-10 h-12">
            <SelectValue placeholder="All Sports">
              {sport === "all" ? "All Sports" : sport}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sports.map((sportName) => (
              <SelectItem key={sportName} value={sportName}>
                {sportName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSearch} className="h-12 px-8" variant="default">
        Search
      </Button>
    </div>
  );
}
